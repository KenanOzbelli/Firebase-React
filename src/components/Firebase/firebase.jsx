import app from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

const config = {
        apiKey: `${process.env.REACT_APP_API_KEY}`,
        authDomain: `${process.env.REACT_APP_AUTH_DOMAIN}`,
        databaseURL: `${process.env.REACT_APP_DATABASE_URL}`,
        projectId: `${process.env.REACT_APP_PROJECT_ID}`,
        storageBucket: `${process.env.REACT_APP_STORAGE_BUCKET}`,
        messagingSenderId: `${process.env.REACT_APP_MESSAGING_SENDER_ID}`,
        appId: `${process.env.REACT_APP_APP_ID}`
};

class Firebase {
    constructor(){
        app.initializeApp(config);
        
        this.emailAuthProvider = app.auth.EmailAuthProvider;
        this.auth = app.auth();
        this.db = app.database();

        this.googleProvider = new app.auth.GoogleAuthProvider();
        this.facebookProvider = new app.auth.FacebookAuthProvider();
    }
    
    // * Auth API *
    doCreateUserWithEmailAndPassword = (email, password) =>  this.auth.createUserWithEmailAndPassword(email, password);

    doSignInWithEmailAndPassword = (email, password) => this.auth.signInWithEmailAndPassword(email, password);

    doSignInWithGoogle = () => this.auth.signInWithPopup(this.googleProvider);
    
    doSignInWithFacebook = () => this.auth.signInWithPopup(this.facebookProvider);
    
    doSignOut = () => this.auth.signOut();

    fetchSignInMethodsForEmail = (email) => this.auth.fetchSignInMethodsForEmail(email);

    doPasswordReset = email => this.auth.sendPasswordResetEmail(email);

    doPassowrdUpdate = password => this.auth.currentUser.updatePassword(password);

    doSendEmailVerification = () => 
        this.auth.currentUser.sendEmailVerification({
            url: process.env.REACT_APP_CONFIRMATION_EMAIL_REDIRECT,
        });


    // *** Merge Auth and DB User API *** //

    onAuthUserListener = (next, fallback) => 
        this.auth.onAuthStateChanged(authUser => {
            if (authUser){
                this.user(authUser.uid)
                  .once('value', snapshot => {
                    const dbUser = snapshot.val();
                  
                        //   default empty roles
                          if(!dbUser.roles){
                              dbUser.roles = {};
                          }
                        if(authUser.photoURL == null){
                           this.auth.currentUser.updateProfile({photoURL:'https://img.icons8.com/clouds/344/head-profile.png'})
                        }
                        // merge auth and db user 
                        authUser = {
                            uid: authUser.uid,
                            email: authUser.email,
                            emailVerified: authUser.emailVerified,
                            providerData: authUser.providerData,
                            ...dbUser,
                        };
                        next(authUser);
                  });
            }else{
                fallback();
            }
        })

    // * User API *

    user = uid => this.db.ref(`users/${uid}`);
    
    updatePhotoURL = url => this.auth.currentUser.updateProfile({photoURL: url});

    users = () => this.db.ref('users');
}
export default Firebase;