import React, { Component } from 'react';
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
    // Regular Login
    onPasswordSubmit = (event) => {
       const {email, password} = this.state;

       this.props.firebase
          .doSignInWithEmailAndPassword(email, password)
          .then(()=> {
            this.props.history.push(ROUTES.HOME);
            this.setState({...INITIAL_STATE});
          })
          .catch((error)=>{
            this.setState({ error })
          })
          event.preventDefault();
    }

    onChange = (event) => {
      this.setState({ [event.target.name]: event.target.value });
    }

  //  Regular Social Logins
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

         if(user.photoURL.includes('picture')){
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

    // HandleExistingLogins

    GoogleSignin = () => {
      console.log('hello')
    }

    facebookSignIn = () => {

    }

    onSocialSubmit = (event) => {
      event.preventDefault();
      switch(this.state.Provider){
        case 'google.com':
          this.GoogleSignin();
        break;
        case 'facebook.com':
          this.facebookSignIn();
          break;
        default: return;
      }
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
    </div> : <HandleExistingUserLogin state={this.state} onchange={this.onChange} onSocialSubmit={this.onSocialSubmit} />}
    {error && <p>{error.message}</p>}
  </div>
    )
  }
};

const HandleExistingUserLogin  = (props) => {
  const {SocialLogin, Useremail, error, Provider, Password } = props.state;
  
  return(
    <>
      {SocialLogin ?  

      <form onSubmit={props.onSocialSubmit}>
        {Provider === 'google.com' ? 
         <>
            <p> Account for {Useremail} Found</p>
          <div style={{display:'inline-block'}}>
              <GOOGLESVG />
            <button type="submit">Sign In with Google</button>
          </div>
         </>
        : 
        <>
            <p> Account for {Useremail}</p>
            <div style={{display:'inline-block'}}>
              <FACEBOOKSVG />
            <button type="submit">Sign In with Facebook</button>
            </div>
        </>
        }
      </form>
      :
      <form onSubmit={props.onPasswordSubmit}>
          <p>Password for {Useremail}</p>
          <input name="Password" type="password" placeholder="password" value={Password} onChange={props.onChange}/>
          <button type="submit">Sign In</button>
      </form>
          }
    </>
  )
}

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

  // onPasswordSubmit = (event) => {
  //   this.props.firebase
  //       .doSignInWithEmailAndPassword(this.state.Useremail, this.state.Password)
  //       .then((result) => {
  //         this.setState({...INITIAL_STATE})
  //         this.props.history.push(ROUTES.HOME)
  //         return result.user.linkWithCredential(this.state.pendingCred);
  //       })
  //       .then(() => {
  //         this.setState({...INITIAL_STATE})
  //         this.props.history.push(ROUTES.HOME);
  //       })
  //       .catch(error => {
  //         this.setState({ error })
  //       })
  //       event.preventDefault();
  // }


  // GoogleSignIn = () => {
  //     this.props.firebase.doSignInWithGoogle()
  //     .then(result => {
  //       this.setState({...INITIAL_STATE})
  //       this.props.history.push(ROUTES.HOME)
  //       result.user.linkAndRetrieveDataWithCredential(this.state.pendingCred).then(usercred => {
  //       console.log(usercred)
  //     })
  //   })
  //   .catch(error => {
  //     this.setState({ error })
  //   })
  // }

  // facebookSignIn = () => {
  //     this.props.firebase.doSignInWithFacebook()
  //     .then(result => {
  //       this.setState({...INITIAL_STATE})
  //       this.props.history.push(ROUTES.HOME)
  //       result.user.linkAndRetrieveDataWithCredential(this.state.pendingCred).then(usercred => {
  //       console.log(usercred)
  //     })
  //   })
  //   .catch(error => {
  //     this.setState({ error })
  //   })
  // }
      <>
      <form onSubmit={props.onSubmit}>
        <button type="submit">Sign In with Facebook</button>
      </form>
      </>
    )

const SignInPage = compose(
  withRouter,
  withFirebase
)(MainSignInPage)


export default SignInPage;

export { SignInFacebookBase, SignInGoogleBase, SignInFormBase, HandleExistingUserLogin  };