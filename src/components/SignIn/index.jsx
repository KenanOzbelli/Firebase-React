import React, { Component, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { SignUpLink } from '../SignUp';
import { PasswordForgetLink } from '../PasswordForget';
import { withFirebase } from '../Firebase';
import { ReactComponent as GOOGLESVG } from '../../assets/google.svg';
import { ReactComponent as FACEBOOKSVG } from '../../assets/facebook.svg';
import * as ROUTES from '../../constants/routes';

const ERROR_CODE_ACCOUNT_EXISTS='auth/account-exists-with-different-credential';
const ERROR_MSG_ACCOUNT_EXISTS=`An account with an E-Mail address to this social account already exists. Try to login from this account instead and associate your social accounts on your personal account page.`;

const INITIAL_STATE = {
  email: '',
  password: '',
  error: null,
  Useremail: null,
  Provider:null, 
  pendingCred:null,  
  SocialLogin: null
};

class MainSignInPage extends Component {

  state={...INITIAL_STATE, authUser: JSON.parse(localStorage.getItem('authUser'))}

    componentDidMount(){
      if(this.state.authUser){
        this.props.history.push(ROUTES.HOME)
      }
    }

    onPasswordSubmit = (event) => {
       const {email, password} = this.state;

       this.props.firebase
          .doSignInWithEmailAndPassword(email, password)
          .then(()=> {
            this.setState({...INITIAL_STATE});
            this.props.history.push(ROUTES.HOME);
          })
          .catch((error)=>{
            this.setState({ error })
          })
          event.preventDefault();
    }

    onChange = (event) => {
      this.setState({ [event.target.name]: event.target.value });
    }

    onGoogleSubmit = (event) => {
      this.props.firebase
        .doSignInWithGoogle()
        .then(socialAuthUser => {
          // Create a user in Firebase Realtime Database 
          this.props.firebase.user(socialAuthUser.user.uid).set({
            username: socialAuthUser.user.displayName,
            email: socialAuthUser.user.email,
            roles:{},
          })
        })   
        .then(() => {
              this.setState({error: null});
              this.props.history.push(ROUTES.HOME);
            })
            .catch(error => {
              if(error.code === ERROR_CODE_ACCOUNT_EXISTS){
                error.message = ERROR_MSG_ACCOUNT_EXISTS
              }
            })
        event.preventDefault();
    }

    onFacebookSubmit = (event) => {
      this.props.firebase.doSignInWithFacebook()
      .then(socialAuthUser => {
        // Create a user in your Firebase Realtime Database
       return this.props.firebase
        .user(socialAuthUser.user.uid)
        .set({
          username: socialAuthUser.additionalUserInfo.profile.name,
          email: socialAuthUser.additionalUserInfo.profile.email,
          roles:{},
        })
        .then(async () => {
         var user = await this.props.firebase.auth.currentUser;
        
         if(user.photoURL != null && user.photoURL.includes('picture')){
           this.props.firebase.updatePhotoURL(socialAuthUser.additionalUserInfo.profile.picture.data.url);
         }
        })
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

            this.props.firebase
            .fetchSignInMethodsForEmail(email)
            .then(methods => {
                if(methods[0] === 'password'){
                  this.setState({SocialLogin: false})
                }else{
                  this.setState({SocialLogin: true, Provider: methods[0]})
                }
            })
          }else{
            this.setState({ error });
          }
      })
      event.preventDefault();
    }

  render(){
    const { SocialLogin, error } = this.state
    return(

  <div>
    {SocialLogin === null  ? 
    <div>
    <h1>SignIn</h1>
    <SignInFormBase state={this.state} onSubmit={this.onPasswordSubmit} onChange={this.onChange}/>
    <SignInGoogleBase onSubmit={this.onGoogleSubmit}/>
    <SignInFacebookBase onSubmit={this.onFacebookSubmit}/> 
    <PasswordForgetLink/>
    <SignUpLink />
    </div> : 
    <HandleExistingUserLogin state={this.state} />}
    {error && <p>{error.message}</p>}
  </div>
    )
  }
};

const SignInFormBase = (props) => {
    const { email, password } = props.state;

    const isInvalid = password === '' || email === '';

    return (
      <form onSubmit={props.onSubmit}>
        <input
          name="email"
          value={email}
          onChange={props.onChange}
          type="text"
          placeholder="Email Address"
        />
        <input
          name="password"
          value={password}
          onChange={props.onChange}
          type="password"
          placeholder="Password"
        />
        <button disabled={isInvalid} type="submit">
          Sign In
        </button>
      </form>
    );
  }

const  SignInGoogleBase = (props) =>  (
      <form onSubmit={props.onSubmit}>
        <button type="submit">Sign In with Google</button>
      </form>
    )

const SignInFacebookBase = (props) => (
      <>
      <form onSubmit={props.onSubmit}>
        <button type="submit">Sign In with Facebook</button>
      </form>
      </>
    )

const HandleExistingUserLoginBase  = (props) => {

      const [state, setState] = useState(props.state);
      const [password, setPassword] = useState('');
      const [ErrMsg , setErrMsg ] = useState(null);

      const onChange = (event) => {
        setPassword(event.target.value);
      }
       const onPasswordSubmit = (event) => {
          props.firebase
            .doSignInWithEmailAndPassword(state.Useremail, password)
            .then(result => {
              result.user.linkWithCredential(state.pendingCred)
            })
            .then(() => {
              setState({...INITIAL_STATE})
              props.history.push(ROUTES.HOME);
            })
            .catch(error => {
              setErrMsg({ error })
            })
            event.preventDefault();
        }
        // HandleExistingLogins
        const GoogleSignin = () => {
          props.firebase
          .doSignInWithGoogle()
          .then(result  => {
            result.user
            .linkAndRetrieveDataWithCredential(state.pendingCred)
            .then(userCred =>{
              console.log('Success')
            })
          })
          .then(()=> {
            setState ({...INITIAL_STATE});
            props.history.push(ROUTES.HOME);
          })
          .catch(error => {
            setErrMsg({ error })
          })
        }
    
       const facebookSignIn = () => {
          props.firebase
          .doSignInWithFacebook()
          .then(result => {
            result.user
            .linkAndRetrieveDataWithCredential(state.pendingCred)
            .then(userCred => {
              console.log('Success')
            })
          })
          .then(() => {
            setState({...INITIAL_STATE});
            props.history.push(ROUTES.HOME)
          })
          .catch(error => {
            setErrMsg({ error: error.ErrMsg })
          })
        }
        
    

    // Switch Case to know which Provider to use
      const  onSocialSubmit = (event) => {
          event.preventDefault();
          switch(state.Provider){
            case 'google.com':
              GoogleSignin();
            break;
            case 'facebook.com':
              facebookSignIn();
              break;
            default: return;
          }
        }
       
      return(
        <>
          {state.SocialLogin ?  
    
          <form onSubmit={onSocialSubmit}>
            {state.Provider === 'google.com' ? 
             <>
              <p> Account for {state.Useremail} found</p>
              <div style={{display:'inline-block'}}>
                <GOOGLESVG />
                <button type="submit">Sign In with Google</button>
              </div>
             </>
            : 
            <>
              <p> Account for {state.Useremail} found</p>
              <div style={{display:'inline-block'}}>
                <FACEBOOKSVG />
              <button type="submit">Sign In with Facebook</button>
              </div>
            </>
            }
          </form>
          :
          <div>
            <p>Password for {state.Useremail} found</p>
            <form onSubmit={onPasswordSubmit}>
                <input name="password" type="password" placeholder="Password" value={password} onChange={onChange}/>
                <button type="submit">Sign In</button>
            </form>
          </div>
              }
          {ErrMsg && <p>{ErrMsg.error.message}</p>}
        </>
      )
    }
    


const SignInPage = compose(
  withRouter,
  withFirebase
)(MainSignInPage)

const HandleExistingUserLogin = compose(
  withRouter,
  withFirebase
)(HandleExistingUserLoginBase)

export default SignInPage;

export { SignInFacebookBase, SignInGoogleBase, SignInFormBase, HandleExistingUserLogin  };