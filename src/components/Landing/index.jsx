import React, { Component } from 'react';
import { withFirebase } from '../Firebase';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import * as ROUTES from '../../constants/routes'
import { AuthUserContext } from '../Session';

class Landing extends Component {
    state ={
      authUser: JSON.parse(localStorage.getItem('authUser'))
    }
      componentDidMount(){
          if(this.state.authUser){
            this.props.history.push('/home')
          }else{
            return;
          }
      }

      render(){
        return(
          <AuthUserContext.Consumer>
            {authUser => 
              authUser ? null : <h1>Landing</h1>
            }
          </AuthUserContext.Consumer>
        
        )
      }
    }

export default compose(withRouter, withFirebase)(Landing);