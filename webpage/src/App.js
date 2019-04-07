import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';

class App extends Component {
  constructor(props){
    super(props)
    this.state = {
      cardnum:'', name:'', token:'', captcha:'', captchaSVG:''
    }
    axios.get('https://lecture.myseu.cn/api/captcha').then(res => {
      this.setState({token:res.data.token, captchaSVG:res.data.captcha})
    })
    
  }
  render() {
    return (
      <div>
       <div dangerouslySetInnerHTML={{__html: this.state.captchaSVG}} />
      </div>
    );
  }
}

export default App;
