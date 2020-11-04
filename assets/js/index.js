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
  return (config.user ? {
    // "mid": "1122010",
    "timestamp": nowTime,
    "uid": +getYouUid(),
    "sign": config.firebaseLogin ? md5Sign(storageHelper.getItem("uid"), nowTime) : 1111,
    "Content-Type": "application/json",
    "authorization": storageHelper.getItem("token")
  } : { "timestamp": nowTime })
}
/* ------------------------------------ New Api ------------------------------------ */
function apiStart(isNext){
  if(config.inMatch) {
    views.startOrNext.checked = false;
    receiveMsg("Searching..., Please wait a minute.", "system");
    return;
  }

  showView(views.waitStranger);
  if(!isNext || !config.roomId || !getStrangerUid()){
    console.warn("Chat No : ", config.chatNo);
    if(config.chatNo){
      println("Have chat, Over the chat.");
      apiOver();
    }
    var url = `https://${config.domain}/api/radar/start`;
    axios.post(url, { status: 1}, { headers: getHeaders()}).then(res => {
      console.log("apiStart => ", res.data);
      if(!rtc.localStream.isPlaying()) initAgora();
    }).catch(error => {
      console.error(error);
    });
    views.startOrNext.classList.add("have-stranger");
    views.startOrNext.checked = false;
    config.inMatch = true;
  }else println("Really Next? Click <Next> button to match next starnger.", "system");
}
function apiEnd(){
  config.inMatch = false;
  var url = `https://${config.domain}/api/radar/end`;
  axios.post(url, { status: 1}, { headers: getHeaders()}).then(res => {
    console.log("apiEnd => ", res.data);
  }).catch(error => {
    console.error(error);
  });
  apiTestMatch();
}
function apiChat(obj){
  var roomId = obj.roomId;
  if(!roomId) throw "apiChat => No roomId";
  var set = new Set(["3421604371457866", "3421604371566241", "3301603086703212"]);
  if(!set.has(obj.remoteUid)){
    views.strangerContainer.backgroundImage = `url(${obj.avatar})`;
    println("No our roomId, Skip.");
    apiSkip(roomId);
    return;
  }
  config.roomId = roomId;
  config.chatNo = obj.chatNo;
  initAgoraOption(obj);
  var url = `https://${config.domain}/api/radar/chat`;
  axios.post(url, { status: 1, code: roomId}, { headers: getHeaders()}).then(res => {
    console.log("apiChat => ", res.data);
    setStrangerUid(obj.remoteUid);
    showLocalStream(true);
  }).catch(error => {
    console.error(error);
    apiOver(config.roomId);
  });
  apiEnd();
}
function apiSkip(roomId){
  roomId = roomId ? roomId : config.roomId;
  if(!roomId) throw "apiSkip => No roomId";
  var url = `https://${config.domain}/api/radar/skip`;
  axios.post(url, { status: 1, code: roomId}, { headers: getHeaders()}).then(res => {
    console.log("apiSkip => ", res.data);
  }).catch(error => {
    console.error(error);
  });
}
function apiOver(obj){
  if(obj && typeof obj === "object") {
    console.log("apiOver : ", obj);
    if(obj.chatNo !== config.chatNo){
      println("ChatNo not same.");
      println("CurChatNo => "+ config.chatNo);
      println("ReceiveChatNo => "+ obj.chatNo);
      return;
    }
    println("ChatNo same.");
    showView(views.waitStranger, "none");
    if(obj.temp === "ccPay"){
      toast("Sorry, your balance is insufficient", null, "warn", 5000);
      showRechargeList();  
    }
  }
  
  var roomId = obj ? obj.roomId : config.roomId;
  if(!roomId) {
    println("apiOver => No roomId",null,"warn");
    return;
  }
  var url = `https://${config.domain}/api/chat/over`;
  axios.post(url, { status: 1, code: roomId}, { headers: getHeaders()}).then(res => {
    println("apiOver => ", res.data);
    if(rtc.client.remoteStreams && rtc.client.remoteStreams.length > 0){
      leaveChannel();
    }else {
      leaveChannel(function(){
        println("Continue searching...");
        apiStart();
      });
    }
  }).catch(error => {
    console.error(error);
    leaveChannel();
  });
}
function apiTestMatch(){
  var url = `https://${config.domain}/myJob/testMatch?uid1=${getYouUid() || "3421604371566241"}&uid2=${getStrangerUid() || "3421604371566241"}`;
  axios.post(url).then(res => {
    println("apiTestMatch => ", res.data);
  }).catch(error => {
    console.error(error);
  });
}
/* ------------------------------------ Error ------------------------------------ */
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

window.addEventListener('beforeunload', (event) => {
  storageHelper.setItem("leaveTime", getNowTime());
  apiEnd();
  apiOver();
  // Cancel the event as stated by the standard.
  event.preventDefault();
  // Older browsers supported custom message
  event.returnValue = "See you again.";
});
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
  var onlyNoRealLoginShow = document.querySelectorAll(".only-noRealLogin-show");
  console.log("Only login show => ", onlyLoginShow.length);
  for(var i=0; i<onlyLoginShow.length; i++) onlyLoginShow[i].style.display = isLogin ? "inline-block" : "none";
  console.log("Only nologin show => ", onlyNologinShow.length);
  for(var j=0; j<onlyNologinShow.length; j++) onlyNologinShow[j].style.display = isLogin ? "none" : "inline-block";
  console.log("Only noRealLogin show => ", onlyNoRealLoginShow.length);
  for(var k=0; k<onlyNoRealLoginShow.length; k++) onlyNoRealLoginShow[k].style.display = (config.user && config.user.isAnonymous) ? "inline-block" : "none";
  // var mode = getQueryVariable("mode");
  // if(mode === "select" && !isLogin) showLogin();
  if(config.user){
    views.youContainer.style.backgroundImage = `url(${storageHelper.getItem("avatar") || config.user.photoURL})`;
  }
}
function anonymousLogin(){
  firebase.auth().signInAnonymously().catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    println(`Anonymous Login Failed : ${errorCode} -> ${errorMessage}`,null, "error");
  });
}
firebase.auth().onAuthStateChanged(function (user) {
  config.user = user;
  option.uid = user.uid.slice(-8);
  initAgora();
  showView(views.waitStranger);
  initView(user && !user.isAnonymous);
  if (user) {
    if(user.isAnonymous){
      login();
      println("Signin by anonymous.", null, "warn");
    }else connectSocket(); // Connect Our Socket Server.
  } else {
    anonymousLogin();
  }
});
/**
 * Start FirebaseUi, Initialize Firebase Views.
 */
function uiStart(){
  ui.start("#firebaseui-auth-container", uiConfig);
}
uiStart();
function getRegion(){
  var re = /^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|\d{3}))?((?:-(?:[\da-z]{5,8}|\d[\da-z]{3}))*)?((?:-[\da-wy-z](?:-[\da-z]{2,8})+)*)?(-x(?:-[\da-z]{1,8})+)?$|^(x(?:-[\da-z]{1,8})+)$/i;

  let foo = re.exec(navigator.language);
  let bar = re.exec(navigator.language);

  console.log(`region ${foo[5]}`); // 'region AT'
  console.log(`region ${bar[5]}`); // 'region CN'
  return bar[5];
}
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
    appId: 342,
    appKey: "fjsihaueoewh36585489848jhjjoidfggeeu342",
    thirdType: 6,
    regionCode: getRegion()
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
      if(!config.user.isAnonymous && !data.data.user.avatar) {
        showBaseinfoPopup();
      }
      if(successTips) println(successTips,null, "success");
      if(config.user && !config.user.isAnonymous) clearCoverSationList();
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
  domain: "vfun.mixit.fun", //"t.livego.live" , "vfun.mixit.fun", "t.livehub.cloud"
  strangerUid: null,
  coverMaxSize: 2 * 1024 * 1024, //2m
  giftList: {
    lollipop: 10,
    rose: 50,
    flowers: 300,
    rocket: 1000
  },
  rechargeList: null,
  rechargeItem: null,
  agora: {
    useToken: false
  }
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
function debugCall(){
  console.log(`YouUid: ${getYouUid()} - strangerUid: ${getStrangerUid()}`);
  console.log(`You Chatno : ${config.chatNo} - inMatch: ${config.inMatch}`);
  console.log("You Role: ", config.userRole, "- roomId: ", config.roomId);
  console.log("Option: ", option);
}
/* ------------------------------------ Chat ------------------------------------ */
function receiveMsg(msg, msgType){
  var msgNode = document.createElement("p");
  msgNode.setAttribute("class", msgType ? msgType+"-msg" : "stranger-msg");
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
  });
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
      if(obj.key !== "HB") console.log("Message from server : ", obj);
      if(obj.levelType === 20) commitReceiveMsg(obj);
      switch(obj.key){
        case "MC": {
          if(obj.remoteUid && obj.remoteUid !== getStrangerUid()){
            println("Receive message, but uid not same.",null, "warn");
            return;
          }
          var isGift = obj.temp === "3";
          receiveMsg(obj.value, isGift ? "gift" : "stranger");
        } break;
        case "HB": config.heartbeat++; if(config.headers % 10 === 1) console.log("Heartbeat : ", config.heartbeat); break;
        case "CC": apiOver(obj); break;
        case "RC": apiChat(obj); break;
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
function clearCoverSationList(stateMsg){
  var serverState = views.conversationList.firstElementChild;
  if(stateMsg) serverState.innerText = stateMsg;
  views.conversationList.innerHTML = "";
  views.conversationList.appendChild(serverState);
}
var changeStranger = (function(){
  var oldMatched = null;
  return function(isMatched){
    println("OldMatched: "+oldMatched);
    if(isMatched === oldMatched){
      println("Match state no change.");
    }else{
      // rtc.client = AgoraRTC.createClient({mode: "rtc", codec: "h264"});
      println("Match state already changed.");
      clearCoverSationList(isMatched ? "Already matched stranger." : "No match stranger.");
      disabledOnlyMatchedView(isMatched);
    }
    oldMatched = isMatched;
  }
})();
function getStrangerUid(){
  console.log("%cGet Stranger Uid: "+config.strangerUid, "color: red;");
  return config.strangerUid;
}
function setStrangerUid(uid){
  changeStranger(uid);
  if(!uid) {
    config.strangerUid = null;
    config.chatNo = null;
    config.roomId = null;
    views.strangerContainer.style.backgroundImage = "";
  }else config.strangerUid = uid;
}
function getYouUid(){
  return storageHelper.getItem("uid");
}

function addChatListener(){
  views.startOrNext.addEventListener("change", function(){
    var isNext = this.checked;
    if(!config.user){
      this.checked = false;
      showLogin();
      return;
    }
    apiStart(isNext);
  });
  views.cancelNext.addEventListener("click", function(){
    views.startOrNext.checked = false;
  });
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
  appID: "9a9ad6aa60bc4b83ab996da07b04850b",
  channel: null,
  uid: config.user ? storageHelper.getItem("uid").slice(-8) : "12346578",
  token: null
}

function initAgoraOption(obj){
  option.channel = obj.roomId;
  option.uid = config.user ? storageHelper.getItem("uid").slice(-8) : "12346578";
  if(config.agora.useToken) option.token = obj.token;
}
function getDevices(call){
  AgoraRTC.getDevices (function(devices) {
    console.table(devices);
    if(typeof call === "function") call(devices);
  }, function(errStr){
    console.error("Failed to getDevice", errStr);
  });
}
// Create a client
rtc.client = AgoraRTC.createClient({mode: "rtc", codec: "vp8"});
function initAgora(call){
  if(!AgoraRTC.checkSystemRequirements()){
    receiveMsg("Sorry, You Browser Don't Support The Website, Please Change A Browswer.", "system");
    return false;
  }
  console.log("initAgora : ", option.uid);
  //1 - Initialize the client
  rtc.client.init(option.appID, function () {
    console.log("1 - init success");
    showLocalStream();
  }, (err) => {
    receiveMsg("System error, Please Refresh the page.", "system");
    apiEnd();
    console.error("1 - ", err);
  });
  addStreamListener();
}
function joinChannel(){
  if(!option.appID || !option.channel){
    receiveMsg("Missing parameters", "system");
    return;
  }
  // Join a channel
  rtc.client.join(option.token ? option.token : null, option.channel, option.uid ? +option.uid : null, function (uid) {
    console.log("2 - join channel: " + option.channel + " success, uid: " + uid);
    rtc.params.uid = uid;
    publishLocalStream();
  }, function(err) {
    apiOver();
    receiveMsg("System error, Please Refresh the page.", "system");
    console.error("2 - client join failed", err)
  });
}
function showLocalStream(nowJoin){
  if(rtc.localStream && nowJoin){
    joinChannel();
    return;
  }
  console.log("Show Local Stream.");
  //3 - Create a local stream
  rtc.localStream = AgoraRTC.createStream({
    streamID: option.uid, //rtc.params.uid
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
    if(nowJoin) joinChannel();
  }, function (err) {
    apiEnd();
    console.error("3 - init local stream failed ", err);
    if(err.msg === "NotAllowedError"){
      // receiveMsg("Unauthorized, does not work", "system");
      println(err.info, err.msg, "error");
    }else println("Video Chat Error");
  });
  
  rtc.localStream.on("videoTrackEnded", function(evt){
    println("VideoTrackEnd", evt, "error", 10 * 1000);
    apiOver();
    // releaseLocalStream();
  });
  rtc.localStream.on("accessDenied", function(evt){
    receiveMsg("Unauthorized, does not work", "system");
    apiEnd();
  });
}
var publishLocalStream = throttle(function(){
  if(!rtc.localStream) {
    println("Local Stream not init.");
    return;
  }
  rtc.client.publish(rtc.localStream, function (err) {
    console.log("3.2 - publish failed");
    console.error(err);
  });
  println("Publish localstream : "+config.userRole, null,null, 10 * 1000);
}, 0.01, function(seconds){
  console.warn(`Publish localstream only excute once in ${seconds}s.`);
});
function unPublishLocalStream(){
  println("Unpublish localstream.",null, null, 5 * 1000);
  rtc.client.unpublish(rtc.localStream, function(err){
    println("Unpublish localstream - Failed.", err, "warn");
  });
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
    remoteStream.on("videoTrackEnded", function(e){
      println("Remote Video Track Ended.", e, "error");
    });
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
    apiOver();
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
    if(config.userRole === "host") {
      println("AnswerCall => Publish localstream : "+getYouUid(), null,null, 10 * 1000);
      answerCall();
    }
  }, config.allIntervalTime, function(){
    println("Stream-Published is Running...");
  });
  rtc.client.off("stream-published", publishedListener);
  rtc.client.on("stream-published", publishedListener);
}
function stopLocalStream(){
  if(!rtc.localStream) return;
  rtc.localStream.stop();
  rtc.localStream.close();
  // Stop playing the remote streams and remove the views
  var youVideo = document.querySelector("#you-container > div:last-child");
  if(youVideo && youVideo.id.match("player")) youVideo.remove();
}
function stopRemoteStream(){
  if(!rtc.remoteStreams) return;
  while (rtc.remoteStreams.length > 0) {
    var stream = rtc.remoteStreams.shift();
    stream.stop();
  }  
  var strangerVideo = document.querySelector("#stranger-container > div:last-child");
  if(strangerVideo && strangerVideo.id.match("player")) {
    println("Remove StrangerStream : ", strangerVideo.id);
    strangerVideo.remove();
  }
}
function leaveChannel(call){
  println("Leave Channel");
  setStrangerUid(null);
  if(!rtc.client) return;
  rtc.client.leave(function () {
    // Stop playing the local stream
    // stopLocalStream();
    unPublishLocalStream();
    stopRemoteStream();
    option.channel = null;
    if(call) call();
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
      apiStart();
      println("No Match, No Send, Start Match.");
      // receiveMsg("No match stranger, Click <Start> or <Next> button to match.", "system");
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
    showLogin();
    receiveMsg("No Login, Click <Login> button to login.");
    return;
  }else if(!config.strangerUid) {
    receiveMsg("No match stranger, Click <Start> or <Next> button to match.", "system");
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
      hideModal(document.getElementById("gift_modal"));
      var msgNode = document.createElement("p");
      msgNode.setAttribute("class", "send-gift-msg");
      msgNode.innerText = `You send a ${giftName} gift.`;
      document.getElementById("conversation-list").appendChild(msgNode);
    }else throw res.data.msg;
  }).catch(error => {
    receiveMsg("Gift giving failed", "system");
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
      if(obj.success) receiveMsg(`Success Recharge., You balance is : ${obj.diamond} diamond`, "system");
      // else receiveMsg("Query balance error!", "Plase try again or refresh the page.", "error", 3000);
    });
  }, 1000);
}
function rechargeFailed(obj){
  receiveMsg("Recharge Failed, Please refresh the page and try again", "system");
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
    receiveMsg("Your nickname is invalid value, Please check again.", "system");
    return;
  }
  var form = new FormData();
  if(cover) form.append("filename", cover);
  form.append("nickname", nickname);
  // form.append("age", age);
  axios.post(url, form, { headers: getHeaders()}).then(res => {
    console.log("SaveBaseInfo => ", res.data);
    if(res.data.msg === "success") {
      login();
      hidePopup("edit_baseinfo_popup");
      storageHelper.setItem("avatar", URL.createObjectURL(cover));
      views.youContainer.style.backgroundImage = `url(${URL.createObjectURL(cover)})`;
    }else throw res.data.msg;
  }).catch(error => {
    println("SaveBaseInfo",error);
    // toast("Failed", "Please try again or refresh the page.", "error", 3000);
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