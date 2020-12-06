import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Navigation from '../Navigation';
import LandingPage from '../Landing';
import SignUpPage from '../SignUp';
import SigninPage from '../SignIn';
import PasswordForgetPage from '../PasswordForget';
import HomePage from '../Home';
import AccountPage from '../Account';
import AdminPage from '../Admin';

import * as ROUTES from '../../constants/routes';

const App = () => {
    return(
    <Router>
     <div>
        <Navigation/>

        <hr/>

        <Route exact path={ROUTES.LANDING} component={LandingPage}/>
        <Route path={ROUTES.SIGNUP} component={SignUpPage} />
        <Route path={ROUTES.SIGNIN} component={SigninPage} />
        <Route path={ROUTES.PASSWORD_FORGET} component={PasswordForgetPage} />
        <Route path={ROUTES.HOME} component={HomePage} />
        <Route path={ROUTES.ACCOUNT} component={AccountPage} />
        <Route path={ROUTES.ADMIN} component={AdminPage} />
     </div>
    </Router>
    )
}

export default App;