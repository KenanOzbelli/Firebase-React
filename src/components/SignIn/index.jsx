import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { SignUpLink } from '../SignUp';
import { PasswordForgetLink } from '../PasswordForget';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';

const ERROR_CODE_ACCOUNT_EXISTS='auth/account-exists-with-different-credential';
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
      this.props.history.push(ROUTES.HOME)
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
  state = {
    Useremail: null,
    Provider:null, 
    pendingCred:null,  
    SocialLogin: null, 
    PasswordLogin: null,
    Password: '',
    ProviderName: null, 
    error: null
  };

  onPasswordSubmit = (event) => {
    this.props.firebase.auth
        .signInWithEmailAndPassword(this.state.Useremail, this.state.Password)
        .then((result) => {
          return result.user.linkWithCredential(this.state.pendingCred);
        })
        .then(() => {
          this.setState({...INITIAL_STATE})
          this.props.history.push(ROUTES.HOME);
        })
        event.preventDefault();
  }

  onChange = (event) => {
    this.setState({[event.target.name]: event.target.value})
  }

  onSocialSubmit = (event) => {
      event.preventDefault();
      
      this.props.firebase.doSignInWithGoogle(this.state.Provider)
      .then(result => {
        result.user.linkAndRetrieveDataWithCredential(this.state.pendingCred).then(usercred => {
          this.setState({...INITIAL_STATE})
          this.props.history.push(ROUTES.HOME)
        })
      })
  }

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

          this.setState({Useremail: email, pendingCred: pendingCred});
          
          this.props.firebase.auth
          .fetchSignInMethodsForEmail(email)
          .then((methods) => {
              if(methods[0] === 'password'){
                this.setState({PasswordLogin: true})
              }else{
                const providername = methods[0].replace('.com','');
                this.setState({SocialLogin: true, Provider: methods[0],ProviderName: providername})
              }
          })
        }else{
        this.setState({ error });
        }
      }) 
      event.preventDefault();
  }
  render(){
    const {PasswordLogin, SocialLogin, Useremail, error, ProviderName, Password } = this.state;
    return(
      <>
      <form onSubmit={this.onSubmit}>
        <button type="submit">Sign In with Facebook</button>
        {error && <p>{error.message}</p>}
      </form>

      {PasswordLogin ? 
        <form onSubmit={this.onPasswordSubmit}>
          <p>Password for {Useremail}</p>
          <input name="Password" type="password" placeholder="password" value={Password} onChange={this.onChange}/>
          <button type="submit">Sign In</button>
        </form> 
      : null}

      {SocialLogin ?
      <form onSubmit={this.onSocialSubmit}>
        <p> Social Login for {Useremail}</p>
          <button type="submit">Sign In with {ProviderName}</button>
        </form> 
      : null}
      </>
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