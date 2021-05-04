import React, { Component } from 'react';
import { PasswordForgetForm } from '../PasswordForget';
import PasswordChangeForm from '../PasswordChange';
import { withAuthorization} from '../Session';
import { withFirebase } from '../Firebase';

const SIGN_IN_METHODS = [
  {
    id:'password',
    provider: null,
  },
  {
    id:'google.com',
    provider:'googleProvider',
  },
  {
    id:'facebook.com',
    provider:'facebookProvider',
  },
];

class AccountBase extends Component {

  state = {
    user: null
  }

  componentDidMount(){
    this.getUser = this.props.firebase.auth.onAuthStateChanged(
       authUser => {
        if(authUser !== null){
            this.setState({user: authUser})
        }
     });
  }

  componentWillUnmount(){
    this.getUser();
  }

  render(){
    const { user } = this.state;
    return(
      <>
      {user == null? 
      <p>Loading....</p> :
      <div>
        <h1>Account: {user.email}</h1>
        <img src={user.photoURL} width={50} height={50} alt={'User Profile'} />
        <PasswordForgetForm/>
        <PasswordChangeForm/>
        <LoginManagement authUser={user} />
      </div>
      }
      </>
  )
  }
};

const SocialLoginToogle = ({
  onlyOneLeft, 
  isEnabled,
  signInMethod,
  onLink,
  onUnlink,
}) => 
  isEnabled ? (
    <button 
    type="button"
    onClick={() => onUnlink(signInMethod.id)}
    disabled={onlyOneLeft}
    >
      Deactivate {signInMethod.id}
    </button>
  ) : (
    <button 
      type="button"
      onClick={() => onLink(signInMethod.provider)}
    >
      Link {signInMethod.id}
    </button>
  )

class DefualtLoginToogle extends Component {
  state = { passwordOne: '', passwordTwo: '' };

  onSubmit = event => {
    event.preventDefault();

    this.props.onLink(this.state.passwordOne);
    this.setState({ passwordOne: '', passwordTwo: '' });
  };

  onChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  }

  render(){
    const {
      onlyOneLeft, 
      isEnabled, 
      signInMethod,
      onUnlink,
    } = this.props;

    const { passwordOne, passwordTwo } = this.state;

    const isInvalid = 
      passwordOne !== passwordTwo || passwordOne === '';
    
    return isEnabled ? (
      <button 
        type="button"
        onClick={() => onUnlink(signInMethod.id)}
        disabled={onlyOneLeft}
        >
          Deactivate {signInMethod.id}
        </button>
    ): (
      <form onSubmit={this.onSubmit}>
        <input
          name="passwordOne"
          value={passwordOne}
          onChange={this.onChange}
          type="password"
          placeholder="New Password"
        />
        <input
          name="passwordTwo"
          value={passwordTwo}
          onChange={this.onChange}
          type="password"
          placeholder="Confirm New Password" 
          />
          <button disabled={isInvalid} type="submit">
            Link {signInMethod.id}
          </button>
      </form>
    )
  }
}

class LoginManagementBase extends Component {

  state={
    activeSignInMethods: [],
    error:null,
  }

  componentDidMount(){
    this.fetchSignInMethods();
  }
  
  fetchSignInMethods = () => {
    this.props.firebase.auth
      .fetchSignInMethodsForEmail(this.props.authUser.email)
      .then(activeSignInMethods => 
        this.setState({ activeSignInMethods, error: null }),
        )
      .catch(error => this.setState({ error }));
  };

  onSocialLoginLink = provider => {
    this.props.firebase.auth.currentUser
    .linkWithPopup(this.props.firebase[provider])
    .then(this.fetchSignInMethods)
    .catch(error => this.setState({ error }));
  };

  onUnlink = providerId => {
    this.props.firebase.auth.currentUser
      .unlink(providerId)
      .then(this.fetchSignInMethods)
      .catch(error => this.setState({ error }));
  };

  onDefaultLoginLink = password => {

    const credential = this.props.firebase.emailAuthProvider.credential(
      this.props.authUser.email,
      password,
    );

    this.props.firebase.auth.currentUser
      .linkWithCredential(credential)
      .then(this.fetchSignInMethods)
      .catch(error => this.setState({ error }));
  }

  render(){
    const { activeSignInMethods, error } = this.state;

    return(
      <div>
        Sign in Methods:
        <ul>
          {SIGN_IN_METHODS.map(signInMethod => {
            const onlyOneLeft = activeSignInMethods.length === 1;
            const isEnabled = activeSignInMethods.includes(
              signInMethod.id,
            )
            return(
              <li key={signInMethod.id}>
                {signInMethod.id === 'password' ? (
                  <DefualtLoginToogle
                    onlyOneLeft={onlyOneLeft}
                    isEnabled={isEnabled}
                    signInMethod={signInMethod} 
                    onLink={this.onDefaultLoginLink}
                    onUnlink={this.onUnlink}
                    />
                ):(
                  <SocialLoginToogle 
                    onlyOneLeft={onlyOneLeft}
                    isEnabled={isEnabled}
                    signInMethod={signInMethod}
                    onLink={this.onSocialLoginLink}
                    onUnlink={this.onUnlink}
                  />
                )}
              </li>
            )
          })}
        </ul>
        {error && error.message}
      </div>
    )
  }
}
const LoginManagement = withFirebase(LoginManagementBase);

const Account = withFirebase(AccountBase)                   

const condition = authUser => !!authUser;

export default withAuthorization(condition)(Account);