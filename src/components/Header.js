import { Button, Container, Grid, Typography } from '@material-ui/core';

export default function Header(props) {
  return (
    <header>
      {/* <Typography variant="h3" component="h1" align="center">
        Package Tracker
      </Typography>
      <Typography variant="subtitle1" component="h2" align="center">
        Searches through emails to find potential tracking numbers for packages
      </Typography> */}
      <Container maxWidth="sm">
        
      <Grid container item direction="row" justifyContent="center" alignItems="center" spacing={2}>
        <Grid item>
          <Typography variant="h3" component="h1" align="center">
            Package Tracker
          </Typography>
          <Typography variant="subtitle2" component="h2" align="center">
            Searches through emails to find potential tracking numbers for packages
          </Typography>
        </Grid>
        <Grid container item xs={6} justifyContent="flex-start" alignItems="center">
          {props.isSignedIn ?
            <Typography style={{ fontWeight: 600 }} display="inline">
              Email: {props.emailAddress}
            </Typography> :
            <Typography style={{ fontWeight: 600 }} display="inline">
              Sign in on the right to get started!
            </Typography>
          }
        </Grid>
        <Grid container item xs={6} justifyContent="flex-end" alignItems="center">
          {props.renderAuthButton()}
        </Grid>
        <div className="button-request">
          <Button onClick={props.track} variant="contained" color="primary" disabled={props.isLoading || !props.isSignedIn}>
            Analyze emails
          </Button>
        </div>
      </Grid>
      </Container>
    </header>
  )
}