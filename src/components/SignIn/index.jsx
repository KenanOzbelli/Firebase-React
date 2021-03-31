import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';

import { SignUpLink } from '../SignUp';
import { PasswordForgetLink } from '../PasswordForget';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';

const ERROR_CODE_ACCOUNT_EXISTS= 'auth/account-exists-with-different-credential';
const ERROR_MSG_ACCOUNT_EXISTS=`An account with an E-Mail address to this social account already exists. Try to login from this account instead and associate your social accounts on your personal account page.`;

const SignInPage = () => (
  <div>
    <h1>SignIn</h1>
    <SignInForm />
    <SignInGoogle/>
    <SignInFacebook /> 
    <PasswordForgetLink/>
    <SignUpLink />
  </div>
);

const INITIAL_STATE = {
  email: '',
  password: '',
  error: null,
};

class SignInFormBase extends Component {
  
  state = { ...INITIAL_STATE, authUser: JSON.parse(localStorage.getItem('authUser'))};

  componentDidMount(){
    if(this.state.authUser){
      this.props.history.push('/home')
    }else{
      console.log('hello No USer')
    }

  }

  onSubmit = event => {
    const { email, password } = this.state;
    this.props.firebase
      .doSignInWithEmailAndPassword(email, password)
      .then(() => {
        this.setState({ ...INITIAL_STATE });
        this.props.history.push(ROUTES.HOME);
      })
      .catch(error => {
        this.setState({ error });
      });

    event.preventDefault();
  };

  onChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  render() {
    const { email, password, error } = this.state;

    const isInvalid = password === '' || email === '';

    return (
      <form onSubmit={this.onSubmit}>
        <input
          name="email"
          value={email}
          onChange={this.onChange}
          type="text"
          placeholder="Email Address"
        />
        <input
          name="password"
          value={password}
          onChange={this.onChange}
          type="password"
          placeholder="Password"
        />
        <button disabled={isInvalid} type="submit">
          Sign In
        </button>

        {error && <p>{error.message}</p>}
      </form>
    );
  }
}

class SignInGoogleBase extends Component {
  state = { error: null };

  onSubmit = event => {    
    this.props.firebase
      .doSignInWithGoogle()
      .then(socialAuthUser => {
        // Create a user in your Firebase Realtime Database too
        return this.props.firebase
          .user(socialAuthUser.user.uid)
          .set({
            username: socialAuthUser.user.displayName,
            email: socialAuthUser.user.email,
            roles:{},
          })
        })
        .then(() => {
          this.setState({ error: null });
          this.props.history.push(ROUTES.HOME);
        })
        .catch(error => {
        if(error.code === ERROR_CODE_ACCOUNT_EXISTS){
            error.message = ERROR_MSG_ACCOUNT_EXISTS;
          }
          
        this.setState({ error });
        });

    event.preventDefault();
  };

  render(){
    const { error } = this.state;

    return(
      <form onSubmit={this.onSubmit}>
        <button type="submit">Sign In with Google</button>

        {error && <p>{error.message}</p>}
      </form>
    );
  }
}

class SignInFacebookBase extends Component {
  state = { error: null };

  onSubmit = event => {
    this.props.firebase
      .doSignInWithFacebook()
      .then(socialAuthUser => {
        // Create a user in your Firebase Realtime Database too
        return this.props.firebase
        .user(socialAuthUser.user.uid)
        .set({
          username: socialAuthUser.additionalUserInfo.profile.name,
          email: socialAuthUser.additionalUserInfo.profile.email,
          roles:{},
        });
      })
      .then(() => {
        this.setState({ error: null });
        this.props.history.push(ROUTES.HOME);
      })
      .catch( error => {
        if(error.code === ERROR_CODE_ACCOUNT_EXISTS){
          const pendingCred = error.credential;
          const email = error.email;

          this.props.firebase
            .fetchSignInMethodsForEmail(email)
            .then(methods => {
              if(methods[0] === 'password'){
                return;
              }

              const provider = methods[0];
              if(provider === 'google.com'){
                this.props.firebase.doSignInWithGoogle().then(function(result){
                  result.user.linkAndRetrieveDataWithCredential(pendingCred).then(usercred => {
                    console.log('hello');
                  })
                })
              }
            })
        }

        this.setState({ error })
      }) 
      event.preventDefault();
  }


  render(){
    const { error } = this.state;
    return(
      <form onSubmit={this.onSubmit}>
        <button type="submit">Sign In with Facebook</button>

        {error && <p>{error.message}</p>}
      </form>
    )
  }
}

const SignInForm = compose(
  withRouter,
  withFirebase,
)(SignInFormBase);

const SignInGoogle = compose(
  withRouter,
  withFirebase
)(SignInGoogleBase)

const SignInFacebook  = compose(
  withRouter,
  withFirebase
)(SignInFacebookBase)

export default SignInPage;

export { SignInFacebook, SignInGoogle, SignInForm };