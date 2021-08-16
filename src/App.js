import './App.scss';
import { GoogleLogin, GoogleLogout } from 'react-google-login';
import { Switch, Route, BrowserRouter as Router } from 'react-router-dom';

import { Box, CircularProgress, Container, CssBaseline, Grid, Typography } from '@material-ui/core';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';

import Header from './components/Header';
import TrackingInfoTable from './components/TrackingInfoTable';
import Footer from './components/Footer';
import PrivacyPolicy from './components/PrivacyPolicy';

import { useState, useEffect, useRef } from 'react';
import base64url from 'base64url';
import { findTracking } from 'ts-tracking-number';

var SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

const theme = createTheme();
theme.typography.h3 = {
  [theme.breakpoints.up('sm')]: {
    fontSize: '2.4rem',
  }
};

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(null);
  var auth = useRef(null);
  const [emailAddress, setEmailAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalEmails, setTotalEmails] = useState(null);
  const [currentEmail, setCurrentEmail] = useState(null);

  const [allTrackingInfo, setAllTrackingInfo] = useState(null);
  var newAllTrackingInfo = useRef(null);


  /*** Auth setup ***/

  useEffect(() => {
    async function getEmailAddress() {
      if (isSignedIn) {
        const res = await sendApiRequest({
          path: '/gmail/v1/users/me/profile/'
        })
        setEmailAddress(res.result.emailAddress);
      } else {
        setEmailAddress(null);
        setAllTrackingInfo(null);
      }
    }

    window.gapi.load("client:auth2", () => {
      window.gapi.client.init({
        apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        scope: SCOPE,
      })
        .then(() => {
          // var auth = window.gapi.auth2.getAuthInstance()
          auth.current = window.gapi.auth2.getAuthInstance()
          // update state so that component will re-render
          setIsSignedIn(auth.current.isSignedIn.get())
          // listen for changes to authentication status
          auth.current.isSignedIn.listen(onAuthChange)
        })
    })

    getEmailAddress()

  }, [isSignedIn])

  // triggered when authentication status changes
  // updates auth state to current auth status
  const onAuthChange = () => {
    setIsSignedIn(auth.current.isSignedIn.get())
    setIsLoading(false)
  }
  const onSignInClick = () => {
    auth.current.signIn()
  }
  const onSignOutClick = () => {
    auth.current.signOut()
  }



  /*** Calling the API and analyzing response ***/

  /**
   * Calls Gmail API and returns thread IDs of matching emails in the user's inbox
   * @returns {Array} Array of thread IDs
   */
  async function getThreadIds() {
    // Set the range of dates (X days ago - tomorrow, in order to include today)
    const today = new Date()
    let tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)
    tomorrow = tomorrow.toLocaleDateString("en-US")
    const certainDaysAgo = new Date(today - 90 * 24 * 3600 * 1000).toLocaleDateString("en-US")

    // Set query string
    // const queryString = `package OR shipping OR shipped OR tracking before:${tomorrow} -return`
    const queryStrings = [
      // `package OR shipping OR shipped OR tracking -return after:${certainDaysAgo} before:${tomorrow}`,
      `in:all package OR shipping OR shipped OR tracking -return after:${certainDaysAgo} before:${tomorrow}`
    ]

    var threadIds = []
    for (const queryString of queryStrings) {
      // Request threads and extract threadIds
      var res = await sendApiRequest({
        path: '/gmail/v1/users/me/threads',
        params: {
          q: queryString
        }
      });
      if (res.error)
        throw new Error(`Error fetching threads, status: ${res.status}`)
      if (res.result.resultSizeEstimate !== 0) {
        threadIds.push(...res.result.threads.map(_ => _.id))
      }

      // If the response returns a nextPageToken, loop through until all threadIds have been extracted
      while ("nextPageToken" in res.result) {
        res = await sendApiRequest({
          path: '/gmail/v1/users/me/threads',
          params: {
            q: queryString,
            pageToken: res.result.nextPageToken
          }
        });
        if (res.error)
          throw new Error(`Error fetching threads on next page, status: ${res.status}`)
        if (res.result.resultSizeEstimate !== 0) {
          threadIds.push(...res.result.threads.map(_ => _.id))
        }
      }
    }

    return threadIds
  }

  /**
   * Calls Gmail API and returns the contents, sender, timestamp, and threadId of an email
   * @param {string} threadId 
   * @returns {Array} Array of email contents, sender, timestamp, and threadId
   */
  async function getThreadInfo(threadId) {
    const resFull = await sendApiRequest({
      path: '/gmail/v1/users/me/messages/' + threadId,
      params: {
        format: 'full'
      }
    });
    if (resFull.error)
      throw new Error(`Error fetching email's full info, status: ${resFull.status}`)

    const resRaw = await sendApiRequest({
      path: '/gmail/v1/users/me/messages/' + threadId,
      params: {
        format: 'raw'
      }
    });
    if (resRaw.error)
      throw new Error(`Error fetching email's raw info, status: ${resRaw.status}`)

    const senders = resFull.result.payload.headers.filter(_ => _.name.toLowerCase() === 'from').map(_ => _.value)
    const sender = senders.length > 0 ? senders[0] : 'Unknown sender'
    // const sender = senders.length > 0 ? senders[0].replace(/ *\<[^)]*\> */g, "") : 'Unknown sender'

    // const text = base64url.decode(resRaw.result.raw);
    const payload = resFull.result.payload;
    let text = "";
    if ("parts" in payload) {
      const body = payload.parts[0].body
      if ("data" in body) {
        text = base64url.decode(body.data)
      }
    } else if ("body" in payload) {
      if ("data" in payload.body) {
        text = base64url.decode(payload.body.data)
      }
    } else {
      throw new Error('Fatal Error: Payload does not contain parts or body!')
    }
    return [text, sender, resRaw.result.internalDate, threadId]
  }

  /**
   * Analyzes an email to find tracking numbers, returns the most likely
   * @param {string} text
   * @returns {string} Tracking number
   */
  async function getTrackingInfo(text) {
    // Get list of potential tracking numbers and carriers
    const trackingNumbers = findTracking(text)

    // Check to see if the text actually contains these key words
    const substrings = ["package", "ship", "tracking", "order"]
    if (new RegExp(substrings.join("|")).test(text) === false) {
      return null
    }

    if (trackingNumbers.length === 0) return null;
    if (trackingNumbers.length === 1) return trackingNumbers[0];

    // Sort by length, assuming longer is more likely
    var sortedByLength = trackingNumbers.sort(
      function (a, b) {
        return b.trackingNumber.length - a.trackingNumber.length;
      }
    );
    return sortedByLength[0];
  }

  /**
   * Takes a request and sends it to the Google API client
   * @param {Object} requestDetails
   * @returns {Object} Response from the API
   */
  async function sendApiRequest(requestDetails) {
    return window.gapi.client.request(requestDetails)
  }

  /**
   * Retrieves emails, analyzes them, and stores tracking information as state
   */
  async function track() {
    setIsLoading(true);
    const threadIds = await getThreadIds()
    newAllTrackingInfo.current = {}
    setTotalEmails(threadIds.length);

    for (const [index, id] of threadIds.entries()) {
      setCurrentEmail(index + 1)
      let text, sender, timestamp, threadId, trackingInfo;
      [text, sender, timestamp, threadId] = await getThreadInfo(id)
      trackingInfo = await getTrackingInfo(text)

      if (trackingInfo !== null) {
        newAllTrackingInfo.current[trackingInfo['trackingNumber']] = {
          number: trackingInfo['trackingNumber'],
          courier: trackingInfo.courier.name === "United States Postal Service" ? "USPS" : trackingInfo.courier.name,
          sender: sender,
          timestamp: timestamp,
          threadId: threadId
        }
      }
    }

    // Sorting the items by timestamp
    var items = Object.keys(newAllTrackingInfo.current).map((key, index) => {
      return newAllTrackingInfo.current[key];
    });
    items.sort(function (first, second) {
      return second['timestamp'] - first['timestamp'];
    });

    setAllTrackingInfo(items)
    setIsLoading(false);
    setTotalEmails(null);
    setCurrentEmail(null)
  }

  // function track() {
  //   console.log(findTracking("alsdkfjsdif soifjo 441291882183 sdfiasdfj woi74890272896721030079o"))
  // }




  /*** Rendering ***/

  /**
   * Returns the login/logout button based on state
   * @returns {Object} Google login/logout button
   */
  const renderAuthButton = () => {
    if (isSignedIn === null)
      // return (<GoogleLogin onClick={onSignInClick} disabled/>)
      return null
    else if (isSignedIn)
      return (<GoogleLogout buttonText="Sign out" onClick={onSignOutClick} />)
    else
      return (<GoogleLogin onClick={onSignInClick} />)
  }

  const renderResults = () => {
    if (!isSignedIn) {
      return null;
    }
    return (
      <Grid container item align="center" justifyContent="center">
        {isLoading &&
          <Grid item>
            {currentEmail && <Typography>Scanning emails: {currentEmail}/{totalEmails}</Typography>}
            <CircularProgress />
          </Grid>
        }
        {/* <TrackingInfoTable allTrackingInfo={[{number: "112312312312323423423487239482734987", timestamp: 2, threadId: 3, courier: 4, sender: "5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555"}]} emailAddress={emailAddress} /> */}
        {!isLoading &&
          <>
            <Box display={{ xs: 'block', sm: 'none' }}>
              <TrackingInfoTable isMobile={true} allTrackingInfo={allTrackingInfo} emailAddress={emailAddress} />
            </Box>
            <Box display={{ xs: 'none', sm: 'block' }}>
              <TrackingInfoTable isMobile={false} allTrackingInfo={allTrackingInfo} emailAddress={emailAddress} />
            </Box>
          </>
        }
      </Grid>
    )
  }



  return (
    <div className="App">
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <Container maxWidth="md" className="container">
          <Router>
            <Switch>
              <Route path="/privacy-policy">
                <PrivacyPolicy />
              </Route>
              <Route path="/">
                <Box className="main-app">
                  <Grid container direction="column" justifyContent="space-between" alignItems="center" className="main-grid">
                    <Header isLoading={isLoading} renderAuthButton={renderAuthButton} track={track} isSignedIn={isSignedIn} emailAddress={emailAddress} />
                    {renderResults()}
                    <Footer />
                  </Grid>
                </Box>
              </Route>
            </Switch>
          </Router>
        </Container>
      </ThemeProvider>
    </div >
  )
}
