import React from 'react';

import { withAuthorization } from '../Session';

const Home = () => (
  <div>
    <h1>Home</h1>
    <p>The Home Page is Accessible by every signed in user</p>
  </div>
);

const condition = authUser => !!authUser;

export default withAuthorization(condition)(Home);