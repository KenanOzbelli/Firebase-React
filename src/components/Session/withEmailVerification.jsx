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
                                {this.state.isSent ? (
                                 <p>
                                   E-Mail confirmation sent: Check your E-Mails (Spam folder inlcuded)
                                   for a confirmation E-Mail.
                                   Refresh this page once you confirm your E-Mail.
                                 </p>
                                ):(
                                <p>
                                    Verify your E-mail: Check your E-Mails (Might be in your spam Folder)
                                    for a confirmation E-Mail or send another confirmation E-Mail.
                                </p>
                                )}

                                 <button type="button" 
                                    onClick={this.onSendEmailVerification}
                                    disabled={this.state.isSent}
                                 >
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