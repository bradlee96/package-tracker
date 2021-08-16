import { Box, Grid, Link, Typography } from '@material-ui/core';
import GitHubIcon from '@material-ui/icons/GitHub';


export default function Footer() {
  return (
    <footer>
      <Grid container direction="column" item spacing={1}>
        <Grid item align="center">
          <Box display={{ xs: 'none', md: 'block' }}>
            <Typography variant="caption">
              Currently, this web app only works with Gmail.
            </Typography>
          </Box>
        </Grid>
        <Grid container item align="center" justifyContent="space-around">
          <Grid item>
            <Typography variant="caption">
              <Link href="https://github.com/bradlee96/package-tracker" target="_blank" rel="noreferrer">
                <GitHubIcon />
              </Link>
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="caption">
              <Link href="https://www.privacypolicies.com/live/d3740594-864d-483c-a02c-753545d6d13a" target="_blank" rel="noreferrer">
                Privacy Policy
              </Link>
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </footer>
  )
}