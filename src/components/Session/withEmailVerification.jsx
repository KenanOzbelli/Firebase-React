import React from 'react';

import AuthUserContext from './context';
import { withFirebase } from '../Firebase';


const needsEmailVerification = authUser => 
    authUser &&
    !authUser.emailVerified && 
    authUser.providerData
     .map(provider => provider.providerId)
     .includes('password');


const withEmailVerification = Component => {
    class withEmailVerification extends React.Component {

        state = { isSent: false };

        onSendEmailVerification = () => {
            this.props.firebase.doSendEmailVerification()
            .then(() => {this.setState({isSent: true})}
            )
        }

        render() {
            return (
                <AuthUserContext.Consumer>
                    {authUser => 
                        needsEmailVerification(authUser)  ? (
                            <div>
                                <p>
                                    Verify your E-mail: Check your E-Mails (Might be in your spam Folder)
                                    for a confirmation E-Mail or send another confirmation E-Mail.
                                </p>
                                <button type="button" onClick={this.onSendEmailVerification}>
                                    Send confirmation Email
                                </button>
                            </div>
                        ):(
                            <Component {...this.props} />
                        )
                   }
                </AuthUserContext.Consumer>
            )
        }
    }
    return withFirebase(withEmailVerification);
};

export default withEmailVerification;