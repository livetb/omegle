/* ------------------------------------ Toolkit ------------------------------------ */
function StorageHelper(app){
  this.app = app;
}
StorageHelper.prototype.setItem = function(key, value){
  key = this.app + "_" + key;
  localStorage.setItem(key, value);
}
StorageHelper.prototype.getItem = function(key){
  key = key = this.app + "_" + key;
  return localStorage.getItem(key);
}
StorageHelper.prototype.removeItems = function(){
  console.log(arguments);
  for(var i in arguments){
    var key = this.app + "_" + arguments[i];
    localStorage.removeItem(key);
  }
}
StorageHelper.prototype.clear = function(){
  for(var key in localStorage){
    if(key.match(this.app)) localStorage.removeItem(key);
  }
}
const storageHelper = new StorageHelper("Omegle");
function showView(ele, displayName){
  if(!ele) throw "Element not exists";
  if(displayName) ele.style.display = displayName;
  else ele.style.display = ele.getAttribute("visible-display") || "inline-block";
}
function enableView(ele, enable){
  if(!ele) throw "Element not exists";
  if(enable){
    ele.removeAttribute("disabled");
    ele.classList.remove("cus-disabled");
  }else {
    ele.setAttribute("disabled", "true");
    ele.classList.add("cus-disabled");
  }
}
function isEmpty(str){
  if(typeof str !== "string") return true;
  if(str.replace(/(^s*)|(s*$)/g, "").length == 0) return true;
  return false; 
}
/**
 * Search Parent Element
 */
function parentByClass(ele, className){
  var parent = ele.parentNode;
  if(parent.classList.contains(className)) return parent;
  if(parent.nodeName === "body") return null;
  return parentByClass(parent, className);
}
/**
 * Analyze Url, Get Parma
 * @param {String} variable - QueryString
 */
function getQueryVariable(variable) {
  var url = window.location.href;
  var x = url.indexOf("?") + 1;
  url = url.substring(x);
  if (!url) return false;
  var arr = url.split("&");
  for (let i = 0; i < arr.length; i++) {
    let cur = arr[i].split("=");
    if (cur[0] === variable) return cur[1];
  }
  return false;
}
/**
 * Choose A Element Fullscreen
 * @param {Element} ele 
 */
function fullScreen(ele) {
  const func =
    ele.requestFullscreen ||
    ele.mozRequestFullScreen ||
    ele.webkitRequestFullscreen ||
    ele.msRequestFullscreen;
  func.call(ele);
}
/**
 * generate request headers and return
 */
function getHeaders(){
  var nowTime = Date.now();
  return {
    // "mid": "1122010",
    "timestamp": nowTime,
    "uid": +getYouUid(),
    "sign": config.firebaseLogin ? md5Sign(storageHelper.getItem("uid"), nowTime) : 1111,
    "Content-Type": "application/json",
    "authorization": storageHelper.getItem("token")
  }
}
/**
 * @param {String} msg - Error Message
 * @param {Interger} status - Default 0: println-error, 1: println-warning
 */
function UserError(msg, status){
  this.msg = msg;
  this.status = status || 0;
}
UserError.prototype.toString = function(){
  return "UserError : " + this.msg;
}
// console.error = (func => {
//   return (...args) => {
//     // 在这里就可以收集到console.error的错误
//     // 做一些事
//     console.log("Listener Error. ",args);
//     func.apply(console, args);
//   }
// })(console.error);

// window.addEventListener("error", function(message, source, lineno, colno, error){
//   console.log("Listener Error. ",error);
//   if(error instanceof UserError){
//     var title = null, type = null;
//     switch(error.status){
//       case 0: title = "Error"; type = "error"; break;
//       case 1: title = "Warning"; type = "warning" ; break;
//     }
//     if(title && type) println(title, error.msg, type, 3000);
//   }
// });

// window.addEventListener('beforeunload', (event) => {
//   youHangup();
//   storageHelper.setItem("leaveTime", getNowTime());
//   // Cancel the event as stated by the standard.
//   event.preventDefault();
//   // Older browsers supported custom message
//   event.returnValue = "See you again.";
// });
/* ------------------------------------ MD5 ------------------------------------ */
function md5Login(firebaseUid, requestTime){
  var key = "fjsihaueoewhdasewrjZgflokejiOKkjhjwiyeKNHJd2342";
  var str = firebaseUid+requestTime+key;
  return hex_md5(str).toUpperCase();
}
function md5Sign(timestamp, uid) {
  var mid = "1122010";
  var key = "fjsihaueoewhdasewrjZgflokejiOKkjhjwiyeKNHJd2342";
  var str = mid + timestamp + uid + key;
  return hex_md5(str).toUpperCase();
}
/* ------------------------------------ Login ------------------------------------ */
var firebaseConfig = {
  apiKey: "AIzaSyAljPP_UOqSqydEXf-6Nnc9pkUzmOxTLWM",
  authDomain: "omegle-9c76d.firebaseapp.com",
  databaseURL: "https://omegle-9c76d.firebaseio.com",
  projectId: "omegle-9c76d",
  storageBucket: "omegle-9c76d.appspot.com",
  messagingSenderId: "1021094019226",
  appId: "1:1021094019226:web:c7f100478dcd4c1f2c9f23",
  measurementId: "G-KQ6P6Z7G76"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// firebase.analytics().logEvent('notification_received');
console.log("Initialize Firebase.");

var ui = new firebaseui.auth.AuthUI(firebase.auth());
var uiConfig = {
  callbacks: {
    // Manul Login
    signInSuccessWithAuthResult: function (authResult, redirectUrl) {
      config.user = authResult.user;
      /**
       * @param {object} authResult - Login Info, Contain UserInfo.
       */
      console.log("Login Success!");
      (async () => {
        var tokenLoader = document.getElementById("tokenLoader");
        showView(tokenLoader, "block");
        tokenLoader.querySelector("span").innerText = "Login Success!";
        setTimeout(() => {
          hideLogin();
        }, 2000);
        login("Login Success!","Login Failed!");
      })();
      return false; //false：Cancel Auto Redirect.
    },
    uiShown: function () {
      // The widget is rendered.
      // Hide the loader.
      document.getElementById("loader").style.display = "none";
    }
  },
  // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
  signInFlow: "popup", //redirect or popup
  signInSuccessUrl: "/",
  signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ],
  // Terms of service url.
  tosUrl: "term_of_service.html",
  // Privacy policy url.
  privacyPolicyUrl: "privacy_policy.html"
};
/**
 * 
 */
function initView(isLogin){
  console.log("InitView => ", isLogin);
  var onlyLoginShow = document.querySelectorAll(".only-login-show");
  var onlyNologinShow = document.querySelectorAll(".only-nologin-show");
  console.log("Only login show => ", onlyLoginShow.length);
  for(var i=0; i<onlyLoginShow.length; i++) onlyLoginShow[i].style.display = isLogin ? "inline-block" : "none";
  console.log("Only nologin show => ", onlyNologinShow.length);
  for(var j=0; j<onlyNologinShow.length; j++) onlyNologinShow[j].style.display = isLogin ? "none" : "inline-block";
  var mode = getQueryVariable("mode");
  if(mode === "select" && !isLogin) showLogin();
  if(isLogin){
    views.youContainer.style.backgroundImage = `url(${storageHelper.getItem("avatar") || config.user.photoURL})`;
  }
}
/**
 * Check Login Or No.
 */
firebase.auth().onAuthStateChanged(function (user) {
  var uid = storageHelper.getItem("uid");
  initView(user);
  if (user && uid) {
    config.user = user;
    connectSocket(); // Connect Our Socket Server.
  } else {
    showLogin()
  }
});
/**
 * Start FirebaseUi, Initialize Firebase Views.
 */
function uiStart(){
  ui.start("#firebaseui-auth-container", uiConfig);
}
uiStart();
/**
 * When Firebase Login Success, Call The Function.
 */
function login(successTips, failedTips){
  var url = `https://${config.domain}/vFun2/user/login`;
  var nowTime = Date.now();
  var dataObj = {
    deviceType: 4,
    requestTime: nowTime,
    loginId: config.user.uid,
    nickName: config.user.displayName,
    sign: md5Login(config.user.uid, nowTime),
    appId: 31,
    thirdType: 6
  }
  axios.post(url, dataObj).then(res => {
    console.log("Login => ", res.data);
    var data = res.data;
    if(data.msg === "success"){
      storageHelper.setItem("token", data.data.token);
      storageHelper.setItem("uid", data.data.user.uid);
      storageHelper.setItem("id", data.data.user.id);
      storageHelper.setItem("avatar", data.data.user.avatar);
      storageHelper.setItem("nickname",data.data.user.nickname);
      if(!data.data.user.avatar) {
        showBaseinfoPopup();
      }
      if(successTips) toast(successTips,null, "success");
      connectSocket();
    }else throw data.msg;
  }).catch(error => {
    if(failedTips) toast(failedTips,null, "error");
    console.error(error);
  });
}
function showLogin(){
  storageHelper.setItem("lastSLT", Date.now());
  showModal("login_modal");
}
function hideLogin(){
  storageHelper.setItem("lastSLT", 0);
  hideModal(document.getElementById("login_modal"));
}
function logout(){
  console.log("Firebase : Logout!");
  firebase.auth().signOut().then(function() {
    if(window.socket) window.socket.close();
    storageHelper.clear();
    console.log("Firebase : Logout Success!");
    window.location.reload(); 
  }).catch(function(error) {
    console.log("Firebase : Logout Error => ", error);
  });
}
function loginByEmail(email, password) {
  firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(error);
    toast("LoginByEmail Falied : "+error.code, error.message, "falied", 5000);
    // ...
  });
}
/* ------------------------------------ Config and Listener ------------------------------------ */
const views = {
  strangerContainer: document.getElementById("stranger-container"),
  youContainer: document.getElementById("you-container"),
  waitStranger: document.getElementById("wait_stranger"),
  startOrNext: document.getElementById("start-or-next"),
  cancelNext: document.getElementById("cancel-next"),
  conversationList: document.getElementById("conversation-list"),
  serverState: document.getElementById("server_state"),
  gift: document.getElementById("gift"),
  youInput: document.getElementById("you-input"),
  send: document.getElementById("send-msg")
}
var config = {
  isTest: true,
  videoCall: true,
  shareScreen: !Boolean(getQueryVariable("screen")),
  allIntervalTime: 10, // Limit User Operation in x Seconds, Only Excute Once.
  firebaseLogin: true, // Start Firebase Verify.
  inMatch: false,
  userRole: "audience",
  videoScale: 0.7,
  heartbeat: 0, 
  domain: "t.livehub.cloud", //"t.livego.live" , "vfun.mixit.fun", "t.livehub.cloud"
  strangerUid: null,
  coverMaxSize: 2 * 1024 * 1024, //2m
  giftList: {
    lollipop: 10,
    rose: 50,
    flowers: 300,
    rocket: 1000
  },
  rechargeList: null,
  rechargeItem: null
}
function getDomain(){
  
}
println(`ShareScreen: ${config.shareScreen}`, null, "success", 5000);
/**
 * Function Only Excute Once in x Seconds, If Current Function Is Not Over, Restart The Calculation Time.
 * @param {*} fn 
 * @param {*} seconds 
 */
function debounce(fn, seconds){
  var timeout = null;
  return function(){
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn.apply(this, arguments);
    }, seconds * 1000);
  }
}
/**
 * Function Only Excute Once in x Seconds, Only Current Function Over, Can Receive Next Call.
 * @param {Function} fn
 * @param {Number} seconds
 * @param {Function} tipsFun
 */
function throttle(fn, seconds, tipsFun){
  var canRun = true;
  return function(){
    if(!canRun) {
      if(tipsFun &&  typeof tipsFun === "function") tipsFun(seconds);
      return;
    }
    canRun = false;
    fn.apply(this, arguments);
    setTimeout(() => {
      canRun = true;
    }, seconds * 1000);
  }
}
/**
 * when window resize to excute func.
 * @param {Function} func 
 */
function addResizeListener(func){
  window.addEventListener("resize", debounce(func, 0.02));
}
function changeYouAndStrangerSize(){
  var you = document.getElementById("you-container");
  var stranger = document.getElementById("stranger-container");
  var width = you.offsetWidth;
  console.log("changeYouAndStrangerSize => You-width => ",width);
  you.style.height = `${width * config.videoScale}px`;
  stranger.style.height = `${width * config.videoScale}px`;
}
function changeChatAndContainer(){
  var youAndStranger = document.querySelector("#you-and-stranger");
  var chatContainer = document.querySelector("#chat-container");
  console.log("Change Chat Container => ", `${youAndStranger.clientHeight}px`);
  chatContainer.style.height = `${youAndStranger.clientHeight}px`;
}
// changeYouAndStrangerSize();
// changeChatAndContainer();
// addResizeListener(changeYouAndStrangerSize);
// addResizeListener(changeChatAndContainer);

function onSendMsgListener(){
  var sendMsgBtn = document.getElementById("send-msg");

  views.youInput.addEventListener("keyup", function(e){
    // console.log("KeyCode => ", e.code);
    if(e.code.match("Enter")) {
      var str =  views.youInput.value;
      if(isEmpty(str)) return;
      else if(!getStrangerUid()){
        sendMsg("");
      }else sendMsg(str.trim());
      views.youInput.value = "";
    }
  });
  sendMsgBtn.addEventListener("click", function(){
    console.log("Click SendMsg button.");
    var str = views.youInput.value;
    if(isEmpty(str)) return;
    sendMsg(str.trim());
    views.youInput.value = "";
  });
}
onSendMsgListener();
/* ------------------------------------ Call ------------------------------------ */
/**
 * 1.User Start Video Call, Only Excute Once In {config.allIntervalTime} seconds.
 */
var callStranger = throttle(function(){
  var url = `https://${config.domain}/api3/video/call`;
  var dataObj = {
    roomId: option.channel,
    agoId: option.appID,
    remoteUid: getStrangerUid(),
    remoteId: option.uid,
    remoteToken: option.token
  }
  axios.post(url, dataObj, { headers: getHeaders()}).then(res => {
    console.log("CallStranger => ", res.data);
    println("1.User Start Video Call.");
    if(res.data.msg === "success"){
      var result = res.data;
      initAgoraOption(result.data);
      initAgora(true);
      config.userRole = "audience";
    }else throw `Status : ${res.data.status}`;
  }).catch(error => {
    setStrangerUid(null);
    console.error("Call Stranger Error.", error);
  });
}, config.allIntervalTime, function(){
  console.warn("Call Stranger Already Running...");
});
/**
 * 2.Server Forward User Call to Host.
 * @param {*} obj 
 */
function videoCallYou(obj){
  console.warn(obj);
  if(config.inMatch){
    config.userRole = "host";
    publishLocalStream();
    println("In Matching, Receive Other Match。",null,null,10 * 1000);
    return;
  }
  config.callYouTime = Date.now();
  console.log("Receive Video Call.",obj);
  config.chatNo = obj.chatNo;
  initAgoraOption(obj);
  setStrangerUid(obj.remoteUid);
  // initAgora();
  config.userRole = "host"; 
  println("2.Server Forward User Call to Host.");
}
/**
 * 3.Host Answer Video Call.
 */
var answerCall = throttle(function(){
  var url = `https://${config.domain}/api3/video/answer`;
  var dataObj = {
    roomId: option.channel,
    remoteUid: +getStrangerUid(),
    status: 1
  }
  axios.post(url, dataObj, { headers: getHeaders() }).then(res => {
    println("3.Host Answer Video Call.",res.data,"success");
  }).catch(error => {
    println("3.Host Answer Video Call. - Error",error, "error");
  });
}, 5, function(seconds){
  console.log(`%cHost Only Answer Call Once In ${seconds}s.`,"color: #00F;");
});
/**
 * 4.Server Forward Host Receive Call To Audience.
 */
function strangerAnswerCall(obj){
  config.chatNo = obj.chatNo;
  println("4.Server Forward Host Receive Call To Audience.", obj);
  // initAgora();
  publishLocalStream();
}
/**
 * 5.You Hnag Up.
 */
function youHangup(callFun){
  println("You Hangup.",null, "error");
  if(!getStrangerUid()) return;
  var url = `https://${config.domain}/api3/video/close`;
  var dataObj = {
    roomId: option.channel,
    remoteUid: +getStrangerUid()
  }
  axios.post(url, dataObj, { headers: getHeaders() }).then(res => {
    println("5.You Hnag Up.", res.data);
    if(typeof callFun === "function") callFun(true);
  }).catch(error => {
    println("5.You Hnag Up. - Error", error, "error");
    if(typeof callFun === "function") callFun(false);
  });
  config.chatNo = null;
  leaveChannel(true);
}
/**
 * 6.Server Forward Hang Up To Other Side.
 */
var strangerHangupYou = throttle(function(obj){
  println("Receive CC from Server.", obj, "error");
  if(obj.temp === "ccPay"){
    queryDiamond(Object => {
      if(Object.success && Object.diamond < 100){
        toast("The balance is insufficient, please recharge", null, "error", 5000);
        showRechargeList();
      }
    });
  }
  println("6.Server Forward Hang Up To Other Side.",obj.chatNo);
  if(obj.chatNo === config.chatNo) {
    youHangup();
    toast("The other already left.");
    println("ChatNo Is Same, Hang Up The Call.");
  }else if(!config.chatNo && config.inMatch){
    youHangup();
    toast("The other did not answer for a long time，Please try again.");
    // getRandomStranger();
  }
}, config.allIntervalTime, function(){
  console.warn("Stranger Hangup You Already Running...");
});

function debugCall(){
  console.log(`YouUid: ${getYouUid()} - strangerUid: ${getStrangerUid()}`);
  console.log(`You Chatno : ${config.chatNo} - inMatch: ${config.inMatch}`);
  console.log("You Role: ", config.userRole);
  console.log("Option: ", option);
}
/* ------------------------------------ Chat ------------------------------------ */
function receiveMsg(msg, isGift){
  var msgNode = document.createElement("p");
  msgNode.setAttribute("class", isGift ? "gift-msg" : "stranger-msg");
  msgNode.innerText = msg;
  document.getElementById("conversation-list").appendChild(msgNode);
}
function sendMsg(msg){
  if(!window.socket) throw new UserError("No Connected Server.", 1);
  if(!config.strangerUid) throw new UserError("No Match Stranger.", 1);
  if(isEmpty(msg)) throw new UserError("Message Is Empty.", 1);
  var msgNode = document.createElement("p");
  var randomId = Math.random().toString().substr(2);
  msgNode.setAttribute("class", `you-msg sending-msg id-${randomId}`);
  msgNode.innerText = msg;
  document.getElementById("conversation-list").appendChild(msgNode);
  var url = `https://${config.domain}/api3/message/send`;
  var dataObj = {
    relateUid: +getStrangerUid(),
    content: msg
  }
  axios.post(url, dataObj, { headers: getHeaders()}).then(res => {
    console.log("Success + Send message + ", res.data);
    if(res.data.msg === "success") {
      setTimeout(() => {
        document.querySelector(`.id-${randomId}`).classList.remove("sending-msg");
      }, 100);
    }
    else document.querySelector(`.id-${randomId}`).classList.add("send-failed");
  }).catch(error => {
    console.error(error);
    document.querySelector(`.id-${randomId}`).classList.add("send-failed");
  });
}
function initConnect(wss){
  if(config.isTest) return;
  var onlyConnectUser = document.querySelectorAll(".only-connect-use");
  console.log("Only Connect use - length : ", onlyConnectUser.length);
  for(var i=0; i<onlyConnectUser.length; i++) onlyConnectUser[i].setAttribute("disabled",`${!Boolean(wss)}`);
}
function commitReceiveMsg(obj){
  var url = `https://${config.domain}/api/websocket/commit`;
  var dataObj = {
    key: obj.key,
    requestId: obj.requestId,
    remoteUid: getYouUid()
  }
  axios.post(url, dataObj, { headers: getHeaders()}).then(res => {
    println("Commit Success => ", res.data, "success");
  }).catch(error => {
    println("Commit Error => ", error, "error");
  })
}
/**
 * Only Login Excute.
 */
function connectSocket(){
  if(!config.user) throw "No Login";
  console.log("ConnectSocket");
  views.serverState.innerText = "Connecting to server...";

  // Create WebSocket connection.
  window.socket = new WebSocket(`wss://${config.domain}/ws?token=${storageHelper.getItem("token")}`);
  //mid=testABC&timestamp=${Date.now()}&uid=${getYouUid()}&sign=1111

  // Connection opened
  socket.addEventListener('open', function (event) {
    initConnect(window.socket);
    views.serverState.innerText = "Already Connected."
    startHeartBeat();
    console.log("Already connected server \n", event);
  });

  // Listen for messages
  socket.addEventListener('message', function (event) {
      var obj = JSON.parse(event.data);
      if(obj.key !== "HB") console.log("Message from server : ", event.data);
      if(obj.levelType === 20) commitReceiveMsg(obj);
      switch(obj.key){
        case "MC": {
          var isGift = obj.temp === "3";
          receiveMsg(obj.value, isGift);
        } break;
        case "SC": videoCallYou(obj); break;
        case "HB": config.heartbeat++; if(config.headers % 10 === 1) console.log("Heartbeat : ", config.heartbeat); break;
        case "AC": strangerAnswerCall(obj); break;
        case "CC": strangerHangupYou(obj); break;
        default: console.log(obj); break;
      }
  });

  socket.addEventListener('close', function(event){
    window.socket = null;
    initConnect(window.socket);
    views.serverState.innerText = "Disconnect Server.";
    console.log("Disconnect server \n", event);
  });
}
/**
 * keep socket alive
 */
function startHeartBeat(){
  setTimeout(() => {
    if(window.socket){
      window.socket.send('{"version":5,"key":"HB","value":1}');
      startHeartBeat();
    }else {
      console.log("Socket Disconnect, Stop Heartbeat");
    }
  }, 10 * 1000);
}
function disabledOnlyMatchedView(isMatched){
  var onlyMatchedUse = document.querySelectorAll(".only-matched-use");
  var onlyMatchedShow= document.querySelectorAll(".only-matched-show");
  println("Only-Matched-Use: "+ onlyMatchedUse.length + " - Only-Matched-Show: "+ onlyMatchedShow.length);
  for(let i=0; i<onlyMatchedUse.length; i++) enableView(onlyMatchedUse[i], isMatched);
  for(let j=0; j<onlyMatchedShow.length; j++) showView(onlyMatchedShow[j], isMatched ? null : "none");
}
var changeStranger = (function(){
  var oldMatched = null;
  return function(isMatched){
    println("OldMatched: "+oldMatched);
    if(isMatched === oldMatched){
      println("Match state no change.");
    }else{
      rtc.client = AgoraRTC.createClient({mode: "rtc", codec: "h264"});
      println("Match state already changed.");
      var serverState = views.conversationList.firstElementChild;
      serverState.innerText = isMatched ? "Already matched stranger." : "No match stranger.";
      views.conversationList.innerHTML = "";
      views.conversationList.appendChild(serverState);
      disabledOnlyMatchedView(isMatched);
      // showView(views.waitStranger, "none");
      config.inMatch = false;
    }
    oldMatched = isMatched;
  }
})();
// function changeStranger(isMatched){
  
// }
function getStrangerUid(){
  console.log("%cGet Stranger Uid: "+config.strangerUid, "color: red;");
  if(!config.strangerUid) config.inMatch = false;
  else config.inMatch = true;
  return config.strangerUid;
}
function setStrangerUid(uid){
  changeStranger(uid);
  if(!uid) {
    config.strangerUid = null;
    config.chatNo = null;
    views.serverState.innerText = "No match stranger.";
    showView(views.waitStranger, "none");
    views.strangerContainer.style.backgroundImage = "";
    config.inMatch = false;
  }else if(config.isTest) {
    config.strangerUid = getQueryVariable("id") || null;
  }else config.strangerUid = uid;
}
function getYouUid(){
  if(config.firebaseLogin) return storageHelper.getItem("uid");

  if(config.user.uid === "YFa0FqVUpybz72Qm9MmZCw4troq2") return "24680";
  else return "13579";
}
function setStrangerState(state, msg) {
  switch(state){
    case "loading":
      console.log("loading"); break;
    case "noMatch":
      console.log("noMatch"); break;
  }
}
/**
 * Match New Stranger, And Over Current call(if calling).
 */
var getRandomStranger = throttle(function(){
  if(config.chatNo){
    println("In Calling, You Hang Up.");
    youHangup();
  }
  var url = `https://${config.domain}/api/together`;
  var dataObj = { code: getQueryVariable("id") };
  axios.post(url, config.isTest ? dataObj : null, { headers: getHeaders()}).then(res => {
    console.log("Success + get random stranger + ", res.data);
    var result = res.data;
    if(result.msg === "success") {
      setStrangerUid(result.data.userInfo.uid);
      initAgoraOption(result.data);
      if(config.videoCall) callStranger();
      if(!config.videoCall) showView(views.waitStranger, "none");
      views.strangerContainer.style.backgroundImage = `url(${res.data.data.userInfo.avatar})`;
    }
    else throw "Failed : GetRandomStranger";
  }).catch(error => {
    setStrangerUid(null);
    console.error(error);
    toast("System error, please try again later",null, "warn", 3000);
  });
}, config.allIntervalTime, function(seconds){
  toast(`Only match once in ${seconds} seconds.`, "Please try again later", "warn", 3000);
});

function addChatListener(){
  var nextTips = throttle(function(){
    toast("Really Next?","Clcik <Really?> Button to Match Next Stranger.", "warn", 10);
  }, 10);
  var startMatch = throttle(function(isNext){
    var nowTime = Date.now(), callYouTime = config.callYouTime || 0;
    println(`NowTime: ${nowTime} - CallYouTime: ${callYouTime} - Time difference：${nowTime - callYouTime}`);
    if((nowTime - callYouTime) < 20 * 1000){
      // config.noFirstCall = true;
      println("Receive Call, Now Connect.");
      initAgora();
      config.callYouTime = 0;
      config.noFirstMatch = true;
      showView(views.waitStranger);
      views.startOrNext.checked = false;
      document.querySelector(".start-or-cancel").classList.add("have-stranger");
      config.noFirstMatch = true;
      return;
    }else if(callYouTime > 1){
      println("Did not answer for a long time，Server hangs up automatically.", "Ready to call.", "warn");
    }else {
      println("Call not received, Ready to call.");
    }
    // println(""+isNext,null,"tips");
    if(!isNext || !config.chatNo || !getStrangerUid()){
      println("Already Login. Start match random stranger.");
      getRandomStranger();
      config.noFirstMatch = true;
      showView(views.waitStranger);
      views.startOrNext.checked = false;
      document.querySelector(".start-or-cancel").classList.add("have-stranger");
    }else {
      nextTips();
    }
  }, 0.01, function(seconds){
    views.startOrNext.checked = false;
    toast(`Only match once in ${seconds} seconds.`, "Please try again later", "warn", 3000);
  });

  views.startOrNext.addEventListener("change", function(){
    var isNext = this.checked;
    if(!config.user){
      this.checked = false;
      showLogin();
      return;
    }
    startMatch(isNext);
  });
  views.cancelNext.addEventListener("click", function(){
    views.startOrNext.checked = false;
  })
}
addChatListener();
/* ------------------------------------ Agora ------------------------------------ */
var rtc = {
  client: null,
  joined: false,
  published: false,
  localStream: null,
  remoteStreams: [],
  params: {}
};
// Options for joining a channel
var option = {
  appID: null,
  channel: null,
  uid: null,
  token: null
}

function initAgoraOption(obj){
  option.appID = obj.agoId;
  option.channel = obj.roomId;
  option.uid = obj.id || obj.remoteId;
  option.token = obj.token;
}
async function getDevices(){
  var result = null;
  await AgoraRTC.getDevices (function(devices) {
    // console.table(devices);
    result = devices;
  }, function(errStr){
    // console.error("Failed to getDevice", errStr);
    result = errStr;
  });
  return result;
}
// Create a client
rtc.client = AgoraRTC.createClient({mode: "rtc", codec: "vp8"});
/**
 * 
 * @param {Boolean} noRelease - unpublish localstream?
 */
function initAgora(noRelease){
  if(!AgoraRTC.checkSystemRequirements()){
    toast("Sorry, You Browser Don't Support The Website, Please Change A Browswer.");
    return false;
  }
  if(!option.appID || !option.channel || !option.token){
    toast("Missing parameters");
    return;
  }
  console.log("initAgora : ", option.uid);
  //1 - Initialize the client
  rtc.client.init(option.appID, function () {
    console.log("1 - init success");
    // Join a channel
    rtc.client.join(option.token ? option.token : null, option.channel, option.uid ? +option.uid : null, function (uid) {
      console.log("2 - join channel: " + option.channel + " success, uid: " + uid);
      rtc.params.uid = uid;
      releaseLocalStream(noRelease);
    }, function(err) {
      setStrangerUid(null);
      toast("System error, Please Refresh the page.",null,"error",5000);
      console.error("2 - client join failed", err)
    });
    }, (err) => {
    setStrangerUid(null);
    toast("System error, Please Refresh the page.",null,"error",5000);
    console.error("1 - ", err);
  });
  addStreamListener();
}
/**
 * 
 */
function releaseLocalStream(noRelease){
  console.log("Release Local Stream.");
  //3 - Create a local stream
  rtc.localStream = AgoraRTC.createStream({
    streamID: rtc.params.uid,
    audio: true,
    video: !config.shareScreen,
    screen: config.shareScreen,
  });
  //3 - Initialize the local stream
  // rtc.localStream.setScreenProfile("480p_2");
  // rtc.localStream.setVideoProfile("360p");
  // videoProfile_default: 480p
  // rtc.localStream.setVideoProfile("240p_3");
  rtc.localStream.init(function () {
    console.log("3 - init local stream success");
    //3.1 - play stream with html element id "local_stream"
    console.log("3.1 - play local stream");
    rtc.localStream.play("you-container",  {fit: "contain"});
    //3.2 - Publish the local stream
    if(!noRelease) publishLocalStream();
  }, function (err) {
    setStrangerUid(null);
    console.error("3 - init local stream failed ", err);
    if(err.msg === "NotAllowedError"){
      toast("Unauthorized, does not work", null, "warn", 3000);
      println(err.info, err.msg, "error");
    }else println("Video Chat Error");
  });
  
  // rtc.localStream.on("videoTrackEnded", function(evt){
  //   toast("VideoTractEnd", evt, null, 10 * 1000);
  //   releaseLocalStream();
  // });
}
var publishLocalStream = throttle(function(){
  if(!rtc.localStream) {
    println("Local Stream not init.");
    return;
  }
  rtc.client.publish(rtc.localStream, function (err) {
    console.log("3.2 - publish failed");
    console.error(err);
    config.inPublishLocalStream = false;
  });
  println("Publish localstream : "+config.userRole, null,null, 10 * 1000);
}, config.allIntervalTime, function(seconds){
  console.warn(`Publish localstream only excute once in ${seconds}s.`);
});
function unPublishLocalStream(){
  println("Unpublish localstream.",null, null, 5 * 1000);
  rtc.client.unpublish(rtc.localStream, function(err){
    println("Unpublish localstream - Failed.", err, "warn");
  });
  config.inPublishLocalStream = false;
}
/**
 * 
 */
function addStreamListener(){
  // remote
  var onStreamAdd = function (evt) {  
    var remoteStream = evt.stream;
    var id = remoteStream.getId();
    if (id !== rtc.params.uid) {
      rtc.client.subscribe(remoteStream, function (err) {
        console.log("stream subscribe failed", err);
      });
    }
    console.log('stream-added remote-uid: ', id);
  }
  rtc.client.off("stream-added", onStreamAdd)
  rtc.client.on("stream-added", onStreamAdd);
  
  var onStreamSubscribed = function (evt) {
    var remoteStream = evt.stream;
    var id = remoteStream.getId();
    // Add a view for the remote stream.
    // addView(id);
    // Play the remote stream.
    // remoteStream.play("remote_video_" + id,  {fit: "contain"});
    publishLocalStream();
    console.info("------ Stream subscribed. ------ ");
    remoteStream.play("stranger-container", {fit: "contain"});
    console.log('stream-subscribed remote-uid: ', id);
    console.log("Other side publish stream.");
  }
  rtc.client.off("stream-subscribed", onStreamSubscribed);
  rtc.client.on("stream-subscribed", onStreamSubscribed);

  var onStreamRemoved = function (evt) {
    println("Really Remove Remote Stream. ", null, "warn", 10 * 1000);
    var remoteStream = evt.stream;
    var id = remoteStream.getId();
    var strangerVideo = document.querySelector("#stranger-container > div:last-child");
    if(strangerVideo.id.match("player")) {
      remoteStream.stop(strangerVideo.id);
      println("Remove StrangerStream : ", strangerVideo.id, "warn", 10 * 1000);
      strangerVideo.remove();
    }
    console.log('stream-removed remote-uid: ', id);
  }
  rtc.client.off("stream-removed", onStreamRemoved);
  rtc.client.on("stream-removed", onStreamRemoved);

  var onPeerLeave = throttle(function(evt) {
    var uid = evt.uid;
    var reason = evt.reason;
    console.log("remote user left ", uid, "reason: ", reason);
    youHangup(function(success){
      toast("Other side already left.","Reason: "+reason, null, 3000);
    });
  }, 5, function(seconds){
    println(`onPeerLeave only excute once in ${seconds}s.`);
  });
  rtc.client.off("peer-leave", onPeerLeave);
  rtc.client.on("peer-leave", onPeerLeave);
  // local
  var onStreamUnpublished = function(evt) {
    println("local stream unpublished", evt);
  }
  rtc.client.off("stream-unpublished", onStreamUnpublished);
  rtc.client.on("stream-unpublished", onStreamUnpublished);

  var publishedListener = throttle(function(evt){
    println("local stream published",evt);
    config.inPublishLocalStream = true;
    if(config.userRole === "host") {
      println("AnswerCall => Publish localstream : "+getYouUid(), null,null, 10 * 1000);
      answerCall();
    }
  }, config.allIntervalTime, function(){
    println("Stream-Published is Running...");
  });
  rtc.client.off("stream-published", publishedListener);
  rtc.client.on("stream-published", publishedListener);

  // var onVideoTrackEnd = function(evt){
  //   toast("Video Track End.", evt, "warn", 10*1000);
  // };
  // rtc.client.off("videoTrackEnded", onVideoTrackEnd);
  // rtc.client.on("videoTrackEnded", onVideoTrackEnd);
}
/**
 * 
 */
function leaveChannel(unPublish){
  setStrangerUid(null);
  if(!rtc.client) return;
  rtc.client.leave(function () {
    // Stop playing the local stream
    if(!rtc.localStream) return;
    rtc.localStream.stop();
    rtc.localStream.close();
    // Stop playing the remote streams and remove the views
    var youVideo = document.querySelector("#you-container > div:last-child");
    if(youVideo && youVideo.id.match("player")) youVideo.remove();

    while (rtc.remoteStreams.length > 0) {
      var stream = rtc.remoteStreams.shift();
      stream.stop();
    }  
    var strangerVideo = document.querySelector("#stranger-container > div:last-child");
    if(strangerVideo && strangerVideo.id.match("player")) {
      println("Remove StrangerStream : ", strangerVideo.id);
      strangerVideo.remove();
    }
    console.log("client leaves channel success");
  }, function (err) {
    console.log("channel leave failed");
    console.error(err);
  });
}

/* ------------------------------------ Gift ------------------------------------ */
(() => {
  views.gift.onclick = function(){
    if(getStrangerUid()){
      showModal("gift_modal");
    }else {
      toast("No match stranger, Click <Start> button to match.",null,null,3000);
    }
  }
  var gifts = document.querySelectorAll(".gift-item");
  for(var i=0; i<gifts.length; i++){
    var curGift = gifts[i];
    curGift.addEventListener("click", function(){
      sendGift(this.getAttribute("alt"));
    });
  }
})();
function hideBodyScrollbar() {
  document.body.classList.add("hide-scroll-bar");
  var modalNum = +(document.body.getAttribute("modal-num") || "0");
  document.body.setAttribute("modal-num", ++modalNum);
}
function showBodyScrollbar() {
  var modalNum = +(document.body.getAttribute("modal-num") || "0");
  document.body.setAttribute("modal-num", --modalNum);
  if(modalNum <= 0) document.body.classList.remove("hide-scroll-bar");
}
function showModal(id){
  hideBodyScrollbar();
  var modal = document.querySelector(`#${id}`);
  if(!modal) throw `No Modal -> #${id}`;
  showView(modal, "flex");
  modal.classList.add("pop-slide-in");
  modal.onanimationend = function(){
    modal.classList.remove("pop-slide-in");
  }
}
function hideModal(e){
  showBodyScrollbar();
  var parent = e.classList.contains("modal") ? e : parentByClass(e, "modal");
  parent.classList.add("pop-slide-out");
  parent.onanimationend = function(){
    parent.classList.remove("pop-slide-out");
    showView(parent, "none");
  }
}
function sendGift(giftName){
  if(isEmpty(giftName)) {
    println("Gift name is : "+giftName,null,"",3000);
    return;
  }else if(!config.user) {
    toast("No Login, Click <Login> button to login.");
    return;
  }else if(!config.strangerUid) {
    toast("No match stranger, Click <Start> button to match.");
    return;
  }
  var url = `https://${config.domain}/api/user/reward`;
  var dataObj = {
    remoteUid: getStrangerUid(),
    key: "web",
    value: config.giftList[giftName.toLowerCase()] + "",
    Type: giftName
  }
  console.log("Send Gift : ", dataObj);
  axios.post(url, dataObj, { headers: getHeaders() }).then(res => {
    if(res.data.msg === "success"){
      toast("Success!","thank your gift.", "", 2000);
      var msgNode = document.createElement("p");
      msgNode.setAttribute("class", "send-gift-msg");
      msgNode.innerText = `You send a ${giftName} gift.`;
      document.getElementById("conversation-list").appendChild(msgNode);
    }else throw res.data.msg;
  }).catch(error => {
    toast("Failed. ",error, "error", 2000);
    showRechargeList();
  });
}
/* ------------------------------------ Recharge ------------------------------------ */
function showRechargeList(){
  if(!config.loadRechargeList) initRechargeList();
  showModal("recharge_modal");
}
var rechargeArr = null;
function initRechargeList(){
  var url = `https://${config.domain}/api/product/list`;
  axios.post(url, { query: { appCode: "vfun"}}, { headers: getHeaders() }).then(res => {
    if(res.data.msg === "success"){
      console.log(res.data);
      rechargeArr = res.data.data;
      renderRechargeList(res.data.data);
      config.rechargeList = res.data.data;
    }else throw res.data.msg;
  }).catch(error => {
    println(error);
  })
}
function renderRechargeList(arr){
  var iconList = ["/assets/img/diamond-1.png", "/assets/img/diamond-2.png", "/assets/img/diamond-3.png",
  "/assets/img/diamond-4.png", "/assets/img/diamond-5.png", "/assets/img/diamond-6.png"];
  var rechargeList = document.getElementById("recharge_list");
  rechargeList.innerHTML = "";
  for(var i=0; i<4; i++){
    var cur = arr[i];
    var curNode = document.createElement("div");
    curNode.setAttribute("alt", i+"");
    curNode.setAttribute("class", `recharge-item${i===2 ? " hot" : ""}`);
    // curNode.innerHTML = `<div class="recharge-diamond"><div class="diamond-container"><img class="cus-icon" src="${iconList[i%6]}"/></div><span class="diamond-number">${cur.diamond}</span></div><span class="recharge-money">${cur.money}</span>`;
    curNode.innerHTML = `<div class="recharge-diamond"><div class="diamond-container"><span class="cus-icon sprite diamond-${i+1}"></span></div><span class="diamond-number">${cur.diamond}</span></div><span class="recharge-money">${cur.money}</span>`;
    rechargeList.appendChild(curNode);
    curNode.addEventListener("click", function(){
      showPaymentList(this.getAttribute("alt"));
    });
  }
}
function showPaymentList(index){
  showModal("payment_modal");
  config.rechargeItem = config.rechargeList[+index];
  config.productIosId = config.rechargeItem.productIosId;
}
function choosePayment(payment){
  var productIosId = config.productIosId;
  if(payment === "stripe") rechargeDiamond(productIosId, "stripe", config.rechargeItem);
  else toast(payment, "No Use.", "", 3000);
}
function rechargeDiamond(productIosId, payment, rechargeItem){
  console.log("productIosId : ", productIosId);
  if(!productIosId) {
    println("No ProductIosId");
    return;
  }
  if(payment === "stripe") rechargeByStripe(productIosId, rechargeItem);
}
function queryDiamond(call){
  var url = `https://${config.domain}/api/user/info`;
  axios.post(url, { code: getYouUid() }, { headers: getHeaders()}).then(res => {
    var diamond = res.data.data.diamond;
    if(typeof call === "function") call({success: true, diamond: diamond});
  }).catch(error => {
    if(typeof call === "function") call({success: false, error: error});
  });
}
function rechargeSuccess(result){
  console.log("Recharge Success.", result);
  var modals = document.querySelectorAll(".modal:not(#recharge_modal)");
  console.log("modals.length : ", modals.lengthg);
  for(var i=0; i<modals.length; i++) {
    var cur = modals[i];
    if(cur.style.display.length > 1) hideModal(cur);
  }
  setTimeout(function(){
    queryDiamond(obj => {
      if(obj.success) toast("Success Recharge.", `You balance is : ${obj.diamond} diamond`, "success", 3000);
      else toast("Query balance error!", "Plase try again or refresh the page.", "error", 3000);
    });
  }, 1000);
}
function rechargeFailed(obj){
  toast("Recharge Failed.", obj);
}
/* ------------------------------------ Stripe ------------------------------------ */
const stripe = Stripe("pk_test_kKiIIn5jbIixQ96SV4NpPZyf00hulVQYuC");
//  - pk_live_Zt23ptBqWWJ8as6k2MBUF3xn00XviuaLpZ
function rechargeByStripe(productIosId, rechargeItem){
  document.querySelector("#stripe_modal .diamond-amount").innerText = rechargeItem.diamond;
  document.querySelector("#stripe_modal .pay-money").innerText = rechargeItem.money;
  showModal("stripe_modal");
  var url = `https://${config.domain}/api/stripe/payment/init`;
  var dataObj = {
    productId: productIosId+"",
    type: 10
  };
  axios.post(url, dataObj, { headers: getHeaders()}).then(res => {
    var data = res.data;
    if(data.msg !== "success"){
      throw data.msg;
    }
    console.log("Recharge By Stripe : ",data);
    var elements = stripe.elements();
    var style = {
      base: {
        color: "#32325d",
        fontFamily: 'Arial, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#32325d"
        }
      },
      invalid: {
        fontFamily: 'Arial, sans-serif',
        color: "#fa755a",
        iconColor: "#fa755a"
      }
    };
    var card = elements.create("card", { style: style });
    console.log("Card => ", card);
    // Stripe injects an iframe into the DOM
    card.mount("#card-element");
    card.on("change", function (event) {
      // Disable the Pay button if there are no card details in the Element
      document.querySelector("button").disabled = event.empty;
      document.querySelector("#card-error").textContent = event.error ? event.error.message : "";
    });
    var form = document.getElementById("payment-form");
    form.addEventListener("submit", function(event) {
      console.log("Submit pay");
      event.preventDefault();
      // Complete payment when the submit button is clicked
      payWithCard(stripe, card, data.data);
    });
  }).catch(error => {
    console.error(error);
    println("Error!", error, "error", 5000);
  });
}

// Calls stripe.confirmCardPayment
// If the card requires authentication Stripe shows a pop-up modal to
// prompt the user to enter authentication details without leaving your page.
var payWithCard = function(stripe_, card, clientSecret) {
  console.log("%cPay width card","color:red;");
  loading(true);
  stripe_
  .confirmCardPayment(clientSecret, {
    payment_method: {
      type: 'card',
      card: card,
      billing_details: {
        name: 'Jenny Rosen',
      }
    }
  })
  .then(function(result) {
    if (result.error) {
      // Show error to your customer
      showError(result.error.message);
      rechargeFailed( {payment: "stripe", error: result.error} );
    } else {
      // The payment succeeded!
      orderComplete(result.paymentIntent.id);
      rechargeSuccess({ payment: "stripe"} );
    }
  });
};
/* ------- UI helpers ------- */
// Shows a success message when the payment is complete
var orderComplete = function(paymentIntentId) {
  loading(false);
  document
    .querySelector(".result-message a")
    .setAttribute(
      "href",
      "https://dashboard.stripe.com/test/payments/" + paymentIntentId
    );
  document.querySelector(".result-message").classList.remove("hidden");
  document.querySelector("#submit").disabled = true;
};
// Show the customer the error from Stripe if their card fails to charge
var showError = function(errorMsgText) {
  loading(false);
  var errorMsg = document.querySelector("#card-error");
  errorMsg.textContent = errorMsgText;
  setTimeout(function() {
    errorMsg.textContent = "";
  }, 4000);
};
// Show a spinner on payment submission
var loading = function(isLoading) {
  if (isLoading) {
    // Disable the button and show a spinner
    document.querySelector("#submit").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("#submit").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
};
/* ------------------------------------ popup ------------------------------------ */
function showPopup(eleId) {
  hideBodyScrollbar();
  var popup = document.getElementById("popup");
  var popPage = document.getElementById(eleId);
  showView(popPage);
  if(!eleId) throw "NO such popup";
  showView(popup, "flex");
  popPage.classList.add("pop-slide-in");
  popPage.onanimationend = function(){
    popPage.classList.remove("pop-slide-in");
  }
}
function hidePopup(eleId) {
  showBodyScrollbar();
  var popup = document.getElementById("popup");
  var popPage = document.getElementById(eleId);
  if(!eleId) throw "NO such popup";
  popPage.classList.add("pop-slide-out");
  popPage.onanimationend = function(){
    popPage.classList.remove("pop-slide-out");
    showView(popup, "none");
    showView(popPage, "none");
  }
}
/* ------------------------------------ Edit Base Info ------------------------------------ */
function showBaseinfoPopup(){
  var avatar = storageHelper.getItem("avatar") || config.user.photoURL;
  var coverShow = document.getElementById("cover_show");
  coverShow.src = avatar;
  showPopup("edit_baseinfo_popup");
  addSaveBaseinfoListener();
}
function saveBaseinfo(){
  var url = `https://${config.domain}/api/user/setProfile`;
  var cover = document.getElementById("cover").files[0];
  var nickname = document.getElementById("nickname").value;
  // var age = +document.getElementById("age").value;
  console.log("Cover: ", cover);
  console.log("Nickname: ",nickname);
  // console.log("Age: ",age);
  if(!nickname) {
    toast("Your nickname is invalid value.", "Please check again.", "warn", 2000);
    return;
  } else if(nickname.length < 8 || nickname.length > 20){
    toast("8 < The length of your nickname < 20", null, "warn", 3000);
    return;
  } else if(!cover) {
    toast("Please choose a avatar.",null,null, 3000);
    return;
  }
  var form = new FormData();
  if(cover) form.append("filename", cover);
  form.append("nickname", nickname);
  // form.append("age", age);
  axios.post(url, form, { headers: getHeaders()}).then(res => {
    console.log("SaveBaseInfo => ", res.data);
    if(res.data.msg === "success") {
      toast("Success",null, "success", 3000);
      login();
      hidePopup("edit_baseinfo_popup");
      storageHelper.setItem("avatar", URL.createObjectURL(cover));
      views.youContainer.style.backgroundImage = `url(${URL.createObjectURL(cover)})`;
    }else throw res.data.msg;
  }).catch(error => {
    println("SaveBaseInfo",error);
    toast("Failed", "Please try again or refresh the page.", "error", 3000);
  });
}
function addSaveBaseinfoListener(){
  var save = document.getElementById("save_baseinfo");
  save.onclick = saveBaseinfo;
  var cover = document.getElementById("cover");
  document.getElementById("nickname").value = storageHelper.getItem("nickname") || config.user.displayName;
  var coverShow = document.getElementById("cover_show");
  cover.onchange = function(){
    var file = cover.files[0];
    if(file.size > config.coverMaxSize){
      toast(`Cover file size cannot exceed ${config.coverMaxSize/1024/1024}m.`,null, "warn", 3000);
    }else if(!/image/.test(file.type)){
      toast("You should choose a image file",null, "warn", 3000);
    }else {
      coverShow.src = URL.createObjectURL(cover.files[0]);
      var tips = document.querySelector(".cover .tips-upfile");
      if(tips) tips.remove();
    }
  }
}
/* ------------------------------------ Toast and Println ------------------------------------ */
function delayRemoveToast(itemNode, duration){
  setTimeout(function(){
    itemNode.classList.add("remove-toast-item");
    itemNode.onanimationend = function(){
      itemNode.remove();
    }
  }, duration);
}
/**
 * Lazy Functiono
 */
function getToastList(){
  var list = document.getElementById("toast_list");
  getToastList = function(){
    return list;
  }
  return getToastList();
}
function getNowTime(){
  var now = new Date();
  var hours = now.getHours();
  var minute = now.getMinutes();
  var seconds = now.getSeconds();
  // return `${now.getFullYear()}/${month>9?"":0}${month}/${date>9?"":0}${date} ${hours>9?"":0}${hours}:${minute>9?"":0}${minute}:${seconds>9?"":0}${seconds}:${now.getMilliseconds()}`;
  return `${hours>9?"":0}${hours}:${minute>9?"":0}${minute}:${seconds>9?"":0}${seconds}:${now.getMilliseconds()}`;
}
/**
 * @param {String} title - must
 * @param {String} msg
 * @param {Emnu} type - null/"warn"/"error"/"success"
 * @param {Number} duration - millisecond
 */
function toast(title, msg , type, duration) {
  println(title, msg, type);
  if(!title) throw new UserError("Toast must set Title");
  if(!duration) duration = 2000;
  var item = document.createElement("div");
  item.setAttribute("class", "toast-item");
  if(typeof type === "string") item.setAttribute("alt", type);

  var titleNode = document.createElement("h2");
  titleNode.setAttribute("class", "toast-title");
  titleNode.innerText = title;
  item.appendChild(titleNode);

  if(msg && msg.length > 0){
    var msgNode = document.createElement("p");
    msgNode.setAttribute("class", "toast-msg");
    msgNode.innerText = msg;
    item.appendChild(msgNode);
  }
  getToastList().appendChild(item);
  delayRemoveToast(item, duration);
}
function println(title, msg, type, other){
  if(!type) type = "normal";
  var hexColor = "#000000";
  switch(type){
    case "success": hexColor = "#34a853"; break;
    case "warn"   : hexColor = "#fbbc05"; break;
    case "error"  : hexColor = "#ea4335"; break;
    default       : hexColor = "#123456"; break;
  }
  console.log("%c"+"& - "+getNowTime()+" "+title, `font-size: 16px; font-weight: 500; color: ${hexColor}`);
  if(!msg) return;
  if(typeof msg !== "string") console.log("& - Object => ", msg);
  else if(msg) console.log("& - %c"+msg, "color: #4285f4;");
  else console.warn(msg);
}