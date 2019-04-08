import React, { Component } from 'react';
import logo from './logo.svg';
import axios from 'axios';
import 'antd-mobile/dist/antd-mobile.css'
import { NavBar, InputItem ,List } from 'antd-mobile';
import { WingBlank, WhiteSpace, Toast } from 'antd-mobile';
import './App.css';
const isIPhone = new RegExp('\\biPhone\\b|\\biPod\\b', 'i').test(window.navigator.userAgent);
let moneyKeyboardWrapProps;
if (isIPhone) {
  moneyKeyboardWrapProps = {
    onTouchStart: e => e.preventDefault(),
  };
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      cardnum: '', name: '', token: '', captcha: '', captchaSVG: '', result:[]
    }
    
    //<div dangerouslySetInnerHTML={{__html: this.state.captchaSVG}} />
    this.refreshCaptcha = this.refreshCaptcha.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.refreshCaptcha()
  }

  refreshCaptcha(){
    axios.get('https://lecture.myseu.cn/api/captcha').then(res => {
      this.setState({ token: res.data.token, captchaSVG: res.data.captcha })
    })
  }

  async handleClick(){
    let res = (await axios.post('/api/query', {cardnum:this.state.cardnum, name:this.state.name, token:this.state.token, captcha:this.state.captcha})).data
    this.refreshCaptcha()
    if(res.err){
      Toast.fail(res.err)
      return
    }
    if(!res.result || (res.result && res.result.length === 0)){
      Toast.fail('查询无结果，请检查信息是否正确')
      return
    }
    this.setState({result: res.result})
  }

  render() {
    let result = null
    if(this.state.result.length > 0){
      let items = this.state.result.map( r =>{
        return <List.Item arrow={r.lectureUrl ? "horizontal" : ""} multipleLine key={r.dateStr+r.location}
        onClick={()=>{if(r.lectureUrl){window.open(r.lectureUrl)}}}
        >
        {r.lectureTitle ? r.lectureTitle : `${r.dateStr} 打卡`}
        {r.lectureTitle ? <List.Item.Brief>
          讲座时间：{r.dateStr}
        </List.Item.Brief> : null}
        <List.Item.Brief>
          地点： {r.location}
        </List.Item.Brief>
        {r.lectureUrl ? <List.Item.Brief style={{color:'#13ACD9'}}>
          点击查看讲座推送
        </List.Item.Brief> : null}
      </List.Item>
      })
      result = <List renderHeader={() => `查询结果(${this.state.result.length})`}>
        {items}
      </List>
    }
    return (
      <div>
        <NavBar
          mode="light"
        >人文讲座记录查询</NavBar>
        <WhiteSpace></WhiteSpace>
        <WingBlank>
        <List
         renderHeader={() => '查询信息'}
        >
          <InputItem
            clear
            placeholder="请输入姓名"
            onChange={(name) => {this.setState({name})}}
            
          >姓名</InputItem>
          <InputItem
            clear
            placeholder="请输入一卡通号"
            onChange={(cardnum) => {this.setState({cardnum})}}
            type="number"
          >一卡通</InputItem>

          <InputItem
            clear
            placeholder="点击更换"
            extra={<div dangerouslySetInnerHTML={{__html: this.state.captchaSVG}} onClick={this.refreshCaptcha}/>}
            onChange={(captcha) => {this.setState({captcha})}}
          >验证码</InputItem>
          
          <List.Item>
            <div
              style={{ width: '100%', color: '#13ACD9', textAlign: 'center' }}
              onClick={this.handleClick}
            >
              点击查询
            </div>
          </List.Item>
        </List>
        <WhiteSpace></WhiteSpace>
        {result}
        <WhiteSpace></WhiteSpace>
        <div class="copyright">
          <div>东南大学文化素质教育中心保留对查询结果的解释权</div>
          <div>小猴偷米工作室 • 东南大学文化素质教育中心</div>
          <div>版权所有 © 2001-2009</div>
        </div>
        <WhiteSpace></WhiteSpace>
        </WingBlank>
      </div>
    );
  }
}

export default App;
