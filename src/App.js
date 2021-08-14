import './App.scss';
import { GoogleLogin, GoogleLogout } from 'react-google-login';

import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import GitHubIcon from '@material-ui/icons/GitHub';
import Typography from '@material-ui/core/Typography'

import TrackingInfo from './components/TrackingInfo';

import { useState, useEffect, useRef } from 'react';
import base64url from 'base64url';
import { findTracking } from 'ts-tracking-number';

var SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

const courierLink = {
  'FedEx': 'https://www.fedex.com/fedextrack/?action=track&trackingnumber=',
  'UPS': 'https://www.ups.com/track?tracknum=',
  'DHL': 'https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=',
  'USPS': 'https://tools.usps.com/go/TrackConfirmAction?&tLabels='
}

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(null);
  var auth = useRef(null);
  const [emailAddress, setEmailAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [allTrackingInfo, setAllTrackingInfo] = useState({});
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
    const tomorrow = new Date(today - 24 * 3600 * 1000).toLocaleDateString("en-US")
    const certainDaysAgo = new Date(today - 90 * 24 * 3600 * 1000).toLocaleDateString("en-US")

    // Set query string
    // const queryString = `package OR shipping OR shipped OR tracking before:${tomorrow} -return`
    const queryString = `package OR shipping OR shipped OR tracking -return after:${certainDaysAgo} before:${tomorrow}`

    // Request threads and extract threadIds
    var res = await sendApiRequest({
      path: '/gmail/v1/users/me/threads',
      params: {
        q: queryString
      }
    });
    if (res.error)
      throw new Error(`Error fetching threads, status: ${res.status}`)
    var threadIds = res.result.resultSizeEstimate === 0 ? [] : res.result.threads.map(_ => _.id)

    // If the response returns a nextPageToken, loop through until all threadIds have been extracted
    while (res.result.nextPageToken) {
      res = await sendApiRequest({
        path: '/gmail/v1/users/me/threads',
        params: {
          q: queryString,
          pageToken: res.result.nextPageToken
        }
      });
      if (res.error)
        throw new Error(`Error fetching threads on next page, status: ${res.status}`)
      threadIds.push(...res.result.threads.map(_ => _.id))
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

    // const rawText = convert(base64url.decode(resRaw.result.raw));
    const rawText = base64url.decode(resRaw.result.raw);
    return [rawText, sender, resRaw.result.internalDate, threadId]
  }

  /**
   * Analyzes an email to find tracking numbers, returns the most likely
   * @param {string} text
   * @returns {string} Tracking number
   */
  async function getTrackingInfo(text) {
    // Get list of potential tracking numbers and carriers
    const trackingNumbers = findTracking(text)
    if (trackingNumbers.length === 0) return null;
    if (trackingNumbers.length === 1) return trackingNumbers[0];
    var longest = trackingNumbers.sort(
      function (a, b) {
        return b.trackingNumber.length - a.trackingNumber.length;
      }
    )[0];
    return longest;
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
  async function runSample() {
    setIsLoading(true);
    const threadIds = await getThreadIds()
    newAllTrackingInfo.current = {}

    for (const id of threadIds) {
      let rawText, sender, timestamp, threadId, trackingInfo;
      [rawText, sender, timestamp, threadId] = await getThreadInfo(id)
      trackingInfo = await getTrackingInfo(rawText)

      if (trackingInfo !== null) {
        newAllTrackingInfo.current[trackingInfo['trackingNumber']] = {
          courier: trackingInfo.courier.name,
          sender: sender,
          timestamp: timestamp,
          threadId: threadId
        }
      }
    }

    setAllTrackingInfo({
      ...allTrackingInfo, ...newAllTrackingInfo.current
    })
    // console.log(allTrackingInfo)
    setIsLoading(false);
  }




  /*** Rendering ***/

  /**
   * Returns the login/logout button based on state
   * @returns {Object} Google login/logout button
   */
  const renderAuthButton = () => {
    if (isSignedIn === null)
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
      <>
        <div className="button-request">
          <Button onClick={runSample} color="primary" disabled={isLoading}>Send request</Button>
        </div>
        <div className="tracking-info">
          {isLoading && <CircularProgress />}
          {Object.keys(allTrackingInfo).length > 0 &&
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sender</th>
                  {/* <th>Carrier</th> */}
                  <th>Tracking Number</th>
                  <th>Tracking Link</th>
                  <th>Original Email</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(allTrackingInfo).map(key =>
                  <TrackingInfo
                    key={key}
                    number={key}
                    sender={allTrackingInfo[key]['sender']}
                    courier={allTrackingInfo[key]['courier']}
                    messageLink={'https://mail.google.com/mail?authuser=' + emailAddress + '#all/' + allTrackingInfo[key]['threadId']}
                    trackingLink={courierLink[allTrackingInfo[key]['courier']] + key}
                    timestamp={new Date(1 * allTrackingInfo[key]['timestamp']).toLocaleDateString()}
                  />
                )}
              </tbody>
            </table>
          }
        </div>
      </>
    )
  }



  return (
    <div className="App">
      <CssBaseline />
      <Container>
        <header>
          <h1>Package Tracker</h1>
          <h2>Searches through emails to find potential tracking numbers for packages</h2>
        </header>
        <article>
          <div className="google-info">
            {isSignedIn && <p>Email: {emailAddress}</p>}
            {renderAuthButton()}
          </div>
          {renderResults()}
        </article>
        <footer>
          <p>Currently, this web app only works with Gmail. Not all returned results will be accurate.</p>
          <a href="https://github.com/bradlee96/package-tracker" target="_blank" rel="noreferrer"><GitHubIcon /></a>
        </footer>
      </Container>
    </div>
  )
}
