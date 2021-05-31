import React from 'react';
import './App.css';
import Amplify from 'aws-amplify';
import { AmplifyAuthenticator, AmplifySignIn, AmplifySignUp, AmplifySignOut } from '@aws-amplify/ui-react';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import awsconfig from './aws-exports'
import {BrowserRouter as Router, Switch, Route, Link} from 'react-router-dom'
import Queries from './Queries'
import UploadImages from './UploadImages'
import ShowAllImages from './ShowAllImages'

Amplify.configure(awsconfig);

const AuthStateApp = () => {
  const [authState, setAuthState] = React.useState();
  const [user, setUser] = React.useState();

  React.useEffect(() => {
      return onAuthUIStateChange((nextAuthState, authData) => {
          setAuthState(nextAuthState);
          setUser(authData)
      });
  }, []);

return authState === AuthState.SignedIn && user ? (

    <div className="App">
      <header className="App-header">
        <div>Hello, {user.attributes.given_name}</div>
        <AmplifySignOut />
        <div className="App">
          <Router>
            <Switch>
              <Route path="/UploadImages" component={UploadImages} /> 
              <Route path="/Queries" component={Queries} />
              <Route path="/ShowAllImages" component={ShowAllImages} />
            </Switch>
            <Link to='/UploadImages'>Go to Upload Images page</Link><br />
            <Link to='/Queries'>Go to Queries page</Link><br />   
            <Link to='/ShowAllImamges'>Browser all the images</Link><br />
          </Router>
        </div>
      </header>
    </div>
  ) : (
      <AmplifyAuthenticator>
          <AmplifySignUp
          slot="sign-up"
          formFields={[
              { type: "username",
              placeholder: "Your email address"},

              { type: "password",
              placeholder: "At least 8 characteristic"},

              { type: "given_name",
              label: "Given Name",
              placeholder: "Enter your given name",
              required: true,
              },

              { type: "family_name",
              label: "Family name",
              placeholder: "Enter your family name",
              required: true,
              }
          ]} 
          />
          <AmplifySignIn slot="sign-in" usernameAlias="email" />
      </AmplifyAuthenticator>
);
}

export default AuthStateApp;
