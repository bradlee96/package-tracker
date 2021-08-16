import { Box, Grid, Link, Typography } from '@material-ui/core';
import { Link as RouterLink } from 'react-router-dom';
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
              <RouterLink to="/privacy-policy">
                Privacy Policy
              </RouterLink>
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </footer>
  )
}