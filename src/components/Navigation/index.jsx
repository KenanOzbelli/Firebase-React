import React from 'react';
import { Link } from 'react-router-dom';

import SignOutButton from '../SignOut';
import * as ROUTES from '../../constants/routes';

const Navigation = ({ authUser }) => (
    <div>{ authUser ? <NavigationAuth /> : <NavigationNonAuth /> } </div>
);

const NavigationAuth = () => (
    <>
    <ul>
        <li>
            <Link to ={ROUTES.SIGNIN}>Sign In</Link>
        </li>
        <li>
            <Link to ={ROUTES.LANDING}>Landing</Link>
        </li>
        <li>
            <Link to ={ROUTES.HOME}>Home</Link>
        </li>
        <li>
            <Link to ={ROUTES.ACCOUNT}>Account</Link>
        </li>
        <li>
            <Link to ={ROUTES.ADMIN}>Admin</Link>
        </li>
        <li>
            <SignOutButton/>
        </li>
    </ul>
    </>
) 
const NavigationNonAuth = () => (
    <ul>
        <li>
            <Link to={ROUTES.LANDING}>Landing</Link>
        </li>
        <li>
            <Link to={ROUTES.SIGNIN}>Sign In</Link>
        </li>
    </ul>
);

export default Navigation;