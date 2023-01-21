!function(){"use strict";const e={methods:{alerts(){this.alert=this.input.map((e=>e?"":"入力してください。"))}}},t={methods:{getNow(){let e=new Date;return e.getFullYear()+"/"+(e.getMonth()+1)+"/"+e.getDate()+" "+e.getHours()+":"+e.getMinutes()}}},s=Vue.createApp({data:()=>({current:"memorize",pages:{memorize:"単語を覚える",register:"登録",settings:"設定"},getAllWords:[],isNowPlaying:!1,voiceArray:[["日本語","ja-JP"],["英語（イギリス）","en-GB"],["英語（アメリカ）","en-US"],["英語（オーストラリア）","en-AU"],["英語（インド）","en-IN"],["フランス語","fr-FR"],["イタリア語","it-IT"],["ドイツ語","de-DE"],["スペイン語","es-ES"],["ギリシャ語","el-GR"],["韓国語","ko-KR"],["ロシア語","ru-RU"],["中国語（中国）","zh-CN"],["中国語（台湾）","zh-TW"],["中国語（香港）","zh-HK"],["アラビア語","ar-SA"]],unsupported:"このブラウザは音声に対応していません。",getNotYetMemorizedWords:[],getAlreadyMemorizedWords:[],formText:[{title:"単語",example:"apple"},{title:"単語の意味",example:"りんご"},{title:"例文",example:"I like apples."},{title:"例文の意味",example:"私はりんごが好きです。"}]}),provide(){return{getAllWords:Vue.computed((()=>this.getAllWords)),isNowPlaying:Vue.computed((()=>this.isNowPlaying)),updateIsNowPlaying:this.updateIsNowPlaying,getSelectVoices:Vue.computed((()=>this.getSelectVoices)),getSelectVoicesOnOff:Vue.computed((()=>this.getSelectVoicesOnOff)),voiceArray:this.voiceArray,updateAllWords:this.updateAllWords,getAlreadyMemorizedWords:Vue.computed((()=>this.getAlreadyMemorizedWords)),getNotYetMemorizedWords:Vue.computed((()=>this.getNotYetMemorizedWords)),updateSelectVoices:this.updateSelectVoices,formText:this.formText}},methods:{onClick(e){this.current=e},updateIsNowPlaying(e){this.isNowPlaying=e},updateAllWords(e){this.getAndSetAllWordsPlusNo(e)},getAndSetAllWordsPlusNo(e){this.getAllWords=e,this.getAllWords.length<10&&(this.current="register"),this.getAllWords.forEach(((e,t)=>e[5]=t)),localStorage.setItem("allWords",JSON.stringify(this.getAllWords));let t=[],s=[];new Promise((e=>{for(let e=0,i=this.getAllWords.length;e<i;++e)this.getAllWords[e][4]?s.push(this.getAllWords[e]):t.push(this.getAllWords[e]);e()})).then((()=>{this.getAlreadyMemorizedWords=s,this.getNotYetMemorizedWords=t}))},updateSelectVoices(e,t){this.getSelectVoices=e,this.getSelectVoicesOnOff=t}},computed:{currentPage(){return`page-${this.current}`}},created(){if(this.getAllWords=JSON.parse(localStorage.getItem("allWords"))||[],this.getAndSetAllWordsPlusNo(this.getAllWords),"speechSynthesis"in window){let e=JSON.parse(localStorage.getItem("voices"))||["en-GB","ja-JP","en-GB","ja-JP"];e.length<1&&(e=["en-GB","ja-JP","en-GB","ja-JP"]),this.getSelectVoices=e;let t=JSON.parse(localStorage.getItem("voicesOnOff"))||[!0,!1,!0,!1];t.length<1&&(t=[!0,!1,!0,!1]),this.getSelectVoicesOnOff=t}else this.getSelectVoices=[],this.getSelectVoicesOnOff=[],delete this.pages.settings}});s.config.unwrapInjectedRef=!0,s.component("page-memorize",{data:()=>({name:"",getNum:"5",isDisplaySelect:!0,nums:[]}),provide(){return{isDisplaySelect:Vue.computed((()=>this.isDisplaySelect)),updateIsDisplaySelect:this.updateIsDisplaySelect,getNum:Vue.computed((()=>this.getNum))}},inject:["getAllWords","updateAllWords"],template:'<div>\n    <h2>単語を覚えよう</h2>\n    <div v-if="isDisplaySelect">\n      単語をいくつ覚えますか？\n      <select v-model.number="getNum" class="selectNum">\n        <option v-for="n in nums" :key="n">{{ n }}</option>\n      </select>\n      個\n    </div>\n    <memorize-vocabulary></memorize-vocabulary>\n    </div>',created(){this.nums=this.getNums()},activated(){this.nums=this.getNums(),this.updateAllWords(this.getAllWords)},methods:{updateIsDisplaySelect(e){this.isDisplaySelect=e},getNums(){let e=Math.floor(this.getAllWords.length/5),t=[];for(let s=0;s<e;++s)t.push(5*s+5);return t}}}).component("memorize-vocabulary",{inject:["getAllWords","isNowPlaying","updateIsNowPlaying","isDisplaySelect","updateIsDisplaySelect","getNum","getSelectVoices","getSelectVoicesOnOff","getNotYetMemorizedWords","getAlreadyMemorizedWords","updateAllWords"],data:()=>({isAuto:!1,isManual:!1,randomWordsIndex:[],displayWords:"",intervalTimerArray:[],countUp:0,num:{order:0,stopped:0},label:{order:["単語→意味","意味→単語"],stopped:["停止する","再開する"]},index:{order:0,stopped:[0,1]},speedRangeIndex:2,autoSpeed:[[5,11,17,23],[4,9,14,19],[3,7,11,15],[2,5,8,11],[1,3,5,7]],randomNo:0,alreadyMemorized10Words:[],isComplete:!1,isStopped:!1,isQuestion:!0,isCorrectArray:[],manualIndex:{cnt:0,cnt2:0},judgeCorrectIndex:e=>e?1:0,percent:100,isCorrectLabel:{text:["誤","正"],class:["complete__icon--again","complete__icon--ok"]},manualOrder:0,orderIndexArray:[[0,1,2,3],[1,0,3,2]],isUnselected:!0,questionWord:"",questionWordArray:["単語","文章"],memorizeWordNum:5,volumeClass:"",isOnOrOff:"",doneWordsNum:0}),template:'\n      <div class="displayWords" v-if="isAuto">\n        <template v-if="isComplete">\n          <p>単語を全て覚えました。覚えた単語は下記です。</p>\n          <ul class="resultList">\n            <li v-for="word in alreadyMemorized10Words">{{ word[0] }} - {{ word[1] }}</li>\n          </ul>\n        </template>\n        <template v-else>\n          <ul class="displayWords__conditions">\n            <li>表示順：\n              <select v-model="index.order">\n                <option v-for="(order,index) in label.order" :key="order" :value="index">{{ order }}</option>\n              </select>\n            </li>\n            <li>表示速度：\n              <label>遅い<input type="range" min="0" max="4" step="1" v-model="speedRangeIndex" />速い</label>\n            </li>\n          </ul>\n          <p class="displayWords__word">\n            {{ displayWords }}\n            <span><i class="fa" :class="volumeClass" aria-hidden="true"></i></span>\n          </p>\n          <div class="displayWords__btn">\n            <template v-if="isAuto">\n              <template v-if="isStopped">\n                <p><small>停止中</small></p>\n              </template>\n              <button @click="onAlreadyMemorized" :disabled="isStopped">もう覚えた</button>\n              <button @click="onStop">{{ label.stopped[index.stopped[0]] }}</button>\n              <p><small>再生中の単語を覚えたと思ったら、「もう覚えた」ボタンを押してね。</small></p>\n              <p><small>覚えた単語 {{ alreadyMemorized10Words.length }}/{{ memorizeWordNum }}個</small></p>\n            </template>\n          </div>\n        </template>\n      </div>\n      <div v-if="isManual">\n        <template v-if="isComplete">\n          <p>正答率 {{ percent }}%</p>\n          <ul class="resultList">\n            <li v-for="(word, index) in randomWordsIndex" :key="word">\n              <p><span class="complete__icon" :class="isCorrectLabel.class[judgeCorrectIndex(isCorrectArray[index*2])]">{{ isCorrectLabel.text[judgeCorrectIndex(isCorrectArray[index*2])] }}</span>　{{ getAllWords[word][0] }} - {{ getAllWords[word][1] }}</p>\n              <p><span class="complete__icon" :class="isCorrectLabel.class[judgeCorrectIndex(isCorrectArray[index*2+1])]">{{ isCorrectLabel.text[judgeCorrectIndex(isCorrectArray[index*2+1])] }}</span>　{{ getAllWords[word][2] }} - {{ getAllWords[word][3] }}</p>\n            </li>\n          </ul>\n        </template>\n        <template v-else>\n          <div class="displayWords__btn" v-if="isUnselected">\n            <button @click="onSelectOrder(true)">単語の意味を覚えたかテスト<br>単語→意味の順番</button>\n            <button @click="onSelectOrder(false)">意味から単語が分かるかテスト<br>意味→単語の順番</button>\n          </div>\n          <div class="displayWords" v-else>\n            <p v-if="isQuestion">下記の<template v-if="this.manualOrder">意味の</template>{{ questionWord }}<template v-if="!this.manualOrder">の意味</template>を思い浮かべてから、「次へ」を押してください。</p>\n            <p v-else>正解の時は「正解」を、間違っていたら「不正解」を押してください。</p>\n            <p class="displayWords__word">\n              {{ displayWords }}\n              <template v-if="getSelectVoices.length>0">\n                <br><span @click="onReadAloud"><i class="fa volumeIcon" :class="volumeClass" aria-hidden="true"></i></span>\n              </template>\n            </p>\n            <div class="displayWords__btn">\n              <template v-if="isQuestion">\n                <button @click="onNext">次へ</button>\n              </template>\n              <template v-else>\n                <button @click="onJudge(true)">正解</button>\n                <button @click="onJudge(false)">不正解</button>\n              </template>\n              <p><small>現在 {{ doneWordsNum }}/{{ memorizeWordNum }}個目</small></p>\n            </div>\n          </div>\n        </template>\n      </div>\n      <template v-if="isComplete">\n        <div class="displayWords__commonBtn">\n          <button @click="onPlayAgain"><template v-if="isAuto">自動再生</template><template v-else>テスト</template>を終了する</button>\n        </div>\n      </template>\n      <template v-else>\n        <div class="displayWords__commonBtn" v-if="!isAuto && !isManual">\n          <button @click="onStart(\'auto\')">自動再生</button>\n          <button @click="onStart(\'manual\')">テスト形式</button>\n        </div>\n        <div class="displayWords__commonBtn" v-else>\n          <button @click="onPlayAgain">最初からやり直す</button>\n        </div>\n      </template>\n      <p v-if="getSelectVoicesOnOff.length>0 && !isNowPlaying" class="attention">現在、自動再生の音声は{{ isOnOrOff }}になっています。<br>上のナビの「設定」から変更できます。</p>\n    ',created(){this.isOnOrOff=this.getSelectVoicesOnOff.some((e=>e))?"オン":"オフ"},activated(){this.isOnOrOff=this.getSelectVoicesOnOff.some((e=>e))?"オン":"オフ"},methods:{onStart(e){this.memorizeWordNum=this.getNum,this.randomWordsIndex=this.getRandomWordsIndex(),"auto"===e?this.onAutoPlay():this.onManualPlay()},onAutoPlay(){this.isAuto=!0,this.isManual=!1,this.countUp=0,this.randomNo=this.getRandomIndex(),this.displayWords=this.getAllWords[this.randomWordsIndex[this.randomNo]][0],this.getSelectVoices.length>0&&(this.volumeClass=this.getSelectVoicesOnOff[0]?"fa-volume-up":""),this.updateIsNowPlaying(!0),this.updateIsDisplaySelect(!1),this.autoPlay()},autoPlay(){this.intervalTimerArray.push(setInterval(function(){this.displayWords=this.getWord(this.autoSpeed[this.speedRangeIndex],this.getAllWords[this.randomWordsIndex[this.randomNo]],this.orderIndexArray[this.index.order]),new Promise((e=>{this.getSelectVoices.length>0&&this.getReadAloud(this.autoSpeed[this.speedRangeIndex],this.orderIndexArray[this.index.order]),e()})).then((()=>{++this.countUp}))}.bind(this),1e3))},getReadAloud(e,t){0===this.countUp?this.getReadAloudState(t,0):this.countUp===e[0]?this.getReadAloudState(t,1):this.countUp===e[1]?this.getReadAloudState(t,2):this.countUp===e[2]&&this.getReadAloudState(t,3)},getReadAloudState(e,t){this.getSelectVoicesOnOff[e[t]]?(this.volumeClass="fa-volume-up",this.onReadAloud(t)):this.volumeClass=""},getWord(e,t,s){return this.countUp<e[0]?t[s[0]]:this.countUp<e[1]?t[s[1]]:this.countUp<e[2]?t[s[2]]:this.countUp<e[3]?t[s[3]]:(this.volumeClass=this.getSelectVoicesOnOff[0]?"fa-volume-up":"",this.countUp=0,this.randomNo=this.getRandomIndex(),this.getAllWords[this.randomWordsIndex[this.randomNo]][0])},onStop(){this.index.stopped=[this.num.stopped=1-this.num.stopped,1-this.num.stopped],this.isStopped=this.index.stopped[0],this.isStopped&&this.intervalTimerArray.length>0&&clearInterval(this.intervalTimerArray.shift()),this.isStopped||this.autoPlay()},getRandomIndex(){return parseInt(Math.random()*this.randomWordsIndex.length)},onAlreadyMemorized(){clearInterval(this.intervalTimerArray.shift()),this.getAllWords[this.randomWordsIndex[this.randomNo]][4]=this.getNow(),this.updateAllWords(this.getAllWords),this.alreadyMemorized10Words.push(this.getAllWords[this.randomWordsIndex[this.randomNo]]),this.randomWordsIndex.splice(this.randomNo,1),this.randomWordsIndex.length?(this.countUp=0,this.onAutoPlay()):this.isComplete=!0},onPlayAgain(){this.isAuto&&this.intervalTimerArray.length>0&&clearInterval(this.intervalTimerArray.shift()),this.isComplete=!1,this.isAuto=!1,this.isManual=!1,this.isUnselected=!0,this.alreadyMemorized10Words=[],this.updateIsNowPlaying(!1),this.updateIsDisplaySelect(!0)},onManualPlay(){this.isManual=!0,this.isAuto=!1,this.isCorrectArray=[],this.manualIndex.cnt=0,this.manualIndex.cnt2=0,this.doneWordsNum=0,this.isQuestion=!0,this.volumeClass="fa-volume-off",this.updateIsNowPlaying(!0),this.updateIsDisplaySelect(!1)},onSelectOrder(e){this.isUnselected=!1,this.manualOrder=e?0:1,this.questionWord=this.questionWordArray[0],this.displayWords=this.getAllWords[this.randomWordsIndex[this.manualIndex.cnt]][this.orderIndexArray[this.manualOrder][this.manualIndex.cnt2]]},onNext(){++this.manualIndex.cnt2,this.isQuestion=!1,this.volumeClass="fa-volume-off",this.displayWords=this.getAllWords[this.randomWordsIndex[this.manualIndex.cnt]][this.orderIndexArray[this.manualOrder][this.manualIndex.cnt2]]},onJudge(e){this.isCorrectArray.push(e),this.isQuestion=!0,this.volumeClass="fa-volume-off";let t=this.isCorrectArray.slice(-2);this.isCorrectArray.length%2==0&&(this.getAllWords[this.randomWordsIndex[this.manualIndex.cnt]][4]=t[0]&&t[1]?this.getNow():0,++this.doneWordsNum),3===this.manualIndex.cnt2?(this.manualIndex.cnt2=0,++this.manualIndex.cnt):this.manualIndex.cnt2=2,this.isCorrectArray.length===2*Number(this.memorizeWordNum)?(this.isComplete=!0,this.manualIndex.cnt=0,this.doneWordsNum=0,this.percent=Math.round(this.isCorrectArray.filter((e=>e)).length/this.isCorrectArray.length*100),this.updateAllWords(this.getAllWords)):(this.displayWords=this.getAllWords[this.randomWordsIndex[this.manualIndex.cnt]][this.orderIndexArray[this.manualOrder][this.manualIndex.cnt2]],this.questionWord=this.manualIndex.cnt2?this.questionWordArray[1]:this.questionWordArray[0])},onReadAloud(e){const t=new SpeechSynthesisUtterance;if(t.text=this.displayWords,this.isAuto){t.lang=this.getSelectVoices[this.orderIndexArray[this.index.order][e]];let s=[.8,1,1,2,3];t.rate=s[this.speedRangeIndex]}else this.isManual&&(t.lang=this.getSelectVoices[this.orderIndexArray[this.manualOrder][this.manualIndex.cnt2]],this.volumeClass="fa-volume-up");window.speechSynthesis.speak(t)},getRandomWordsIndex(){let e=0,t=[],s=this.getAlreadyMemorizedWords.map((e=>e[5])),i=this.getNotYetMemorizedWords.map((e=>e[5]));if(i.length<Number(this.memorizeWordNum)){s.sort((function(e,t){return e>t?1:-1}));let e=Number(this.memorizeWordNum)-i.length,l=s.slice(0,e);t=i.concat(l),t=this.shuffleWords(t)}else for(let s=0,l=i.length;s<Number(this.memorizeWordNum);++s,--l)e=Math.floor(Math.random()*l),t.push(i.splice(e,1)[0]);return t},shuffleWords(e){let t,s,i;for(let l=0,n=e.length;l<n;--n)t=Math.floor(Math.random()*n),s=e[n-1],i=e[t],e.splice(n-1,1,i),e.splice(t,1,s);return e}},mixins:[t]}).component("page-register",{data(){return{name:"",isNotEdit:!0,editIndex:this.editIndex}},provide(){return{isNotEdit:this.isNotEdit}},template:'\n    <div v-if="isNotEdit">\n      <h2>単語を登録しよう</h2>\n      <register-new></register-new>\n      <register-list @judgeIsNotEdit="judgeIsNotEdit"></register-list>\n    </div>\n    <div v-else>\n      <list-edit @judgeIsNotEdit="judgeIsNotEdit" :editIndex="editIndex"></list-edit>\n    </div>\n    ',methods:{judgeIsNotEdit(e){this.isNotEdit=!this.isNotEdit,this.editIndex=e}}}).component("register-new",{inject:["getAllWords","updateAllWords","formText"],data:()=>({input:Array(4).fill(""),alert:Array(4).fill(""),isDisabled:!0,isAdded:!1,wordList:"#wordList"}),template:'<div>\n      <p v-if="getAllWords.length<10" class="attention">最初に10個以上、単語を登録してください。</p>\n      <div class="btn--right"><button v-scroll-to="wordList">登録済みの<br>単語リスト</button></div>\n      <h3>新規登録</h3>\n      <dl class="form">\n      <template v-for="(f,index) in formText" :key="f.title">\n        <dt>{{ f.title }}<small class="required">※必須 {{ alert[index] }}</small></dt>\n        <dd v-if="index<2"><input type="text" size="30" v-model.trim="input[index]" /><br><small>例）{{ f.example }}</small></dd>\n        <dd v-else><textarea cols="30" rows="5" v-model.trim="input[index]"></textarea><br><small>例）{{ f.example }}</small></dd>\n      </template>\n      </dl>\n      <div class="displayWords__btn">\n        <button @click="onRegister" :disabled="isDisabled">単語を登録する</button>\n      </div>\n    </div>',watch:{input:{handler(e){this.isDisabled=!this.input.every((e=>e.length>0)),this.isAdded?this.isAdded=!1:this.alerts()},deep:!0}},methods:{onRegister(){this.input[4]=0,this.input[5]="",this.getAllWords.push(this.input),this.input=Array(4).fill(""),this.isAdded=!0,this.updateAllWords(this.getAllWords)}},mixins:[e]}).component("register-list",{inject:["getNotYetMemorizedWords","getAlreadyMemorizedWords","updateAllWords","getAllWords"],emits:["judgeIsNotEdit"],data:()=>({top:"#top"}),activated(){this.updateAllWords(this.getAllWords)},template:'<div id="wordList">\n      <h3 class="wordList__title">覚えていない単語</h3>\n      <template v-if="getNotYetMemorizedWords.length>0">\n        <p class="wordList__total">{{ getNotYetMemorizedWords.length }}個</p>\n        <ul class="list">\n          <li v-for="word in getNotYetMemorizedWords" :key="word" @click="onEdit(word[5])">{{ word[0] }}</li>\n        </ul>\n      </template>\n      <template v-else>\n        <p class="attention">まだ覚えていない単語はありません。</p>\n      </template>\n      <h3 class="wordList__title">覚えた単語</h3>\n      <template v-if="getAlreadyMemorizedWords.length>0">\n        <p class="wordList__total">{{ getAlreadyMemorizedWords.length }}個</p>\n        <ul class="list">\n          <li v-for="word in getAlreadyMemorizedWords" :key="word" @click="onEdit(word[5])">{{ word[0] }}</li>\n        </ul>\n      </template>\n      <template v-else>\n        <p class="attention">既に覚えた単語はありません。</p>\n      </template>\n      <div class="btn--right"><button v-scroll-to="top">ページトップへ</button></div>\n    </div>',methods:{onEdit(e){this.$emit("judgeIsNotEdit",e)}}}).component("list-edit",{inject:["getAllWords","updateAllWords","formText"],props:["editIndex"],emits:["judgeIsNotEdit"],data(){return{hasAlreadyMemorized:!1,registerDate:0,isDisabled:!0,alert:Array(4).fill(""),isAuto:this.isAuto,input:[]}},template:'<div>\n      <h3>単語の編集</h3>\n      <dl class="form">\n        <template v-for="(f,index) in formText" :key="f.title">\n          <dt>{{ f.title }}<small class="required">※必須 {{ alert[index] }}</small></dt>\n          <dd v-if="index<2"><input type="text" size="30" v-model.trim="input[index]" /><br><small>例）{{ f.example }}</small></dd>\n          <dd v-else><textarea cols="30" rows="5" v-model.trim="input[index]"></textarea><br><small>例）{{ f.example }}</small></dd>\n        </template>\n        <dt></dt>\n        <dd>\n          <label><input type="checkbox" v-model="hasAlreadyMemorized" @change="onChangeCheck" />この単語を覚えた</label>\n          <template v-if="hasAlreadyMemorized">（{{ registerDate }}）</template>\n        </dd>\n      </dl>\n      <div class="displayWords__btn">\n        <button @click="onChange(editIndex)" :disabled="isDisabled">変更を保存する</button>\n        <button @click="onUnchange()">変更をキャンセルする</button><br>\n        <button @click="onDelete(editIndex)">この単語を削除する</button>\n      </div>\n    </div>',watch:{input:{handler(){this.judgeDisabled(),this.alerts()},deep:!0}},methods:{onChangeCheck(){this.registerDate=this.hasAlreadyMemorized?this.getNow():this.getAllWords[this.editIndex][4],this.judgeDisabled()},onChange(e){let t=this.hasAlreadyMemorized?this.registerDate:0,s=this.input.concat([t,this.getAllWords[e][5]]);this.getAllWords.splice(e,1,s),this.$emit("judgeIsNotEdit"),this.updateAllWords(this.getAllWords)},onUnchange(){this.$emit("judgeIsNotEdit")},onDelete(e){this.getAllWords.splice(e,1),this.$emit("judgeIsNotEdit"),this.updateAllWords(this.getAllWords)},judgeDisabled(){let e=this.hasAlreadyMemorized?this.registerDate:0,t=this.input.concat([e,this.getAllWords[this.editIndex][5]]).toString()!==this.getAllWords[this.editIndex].toString();this.isDisabled=!t&&Boolean(this.getAllWords[this.editIndex][4])===this.hasAlreadyMemorized,this.input.some((e=>!e))&&(this.isDisabled=!0)}},mounted(){this.hasAlreadyMemorized=!!this.getAllWords[this.editIndex][4],this.registerDate=this.getAllWords[this.editIndex][4]?this.getAllWords[this.editIndex][4]:0,this.input=this.getAllWords[this.editIndex].slice(0,4)},mixins:[e,t]}).component("page-settings",{inject:["getSelectVoices","voiceArray","getSelectVoicesOnOff","updateSelectVoices","formText"],data:()=>({selectVoicesOnOffText:[],isDisabled:!0,initialValue:[],initialValueOnOff:[]}),template:'<div>\n      <h3>音声の設定</h3>\n      <dl class="form">\n        <template v-for="(f, index) in formText" :key="f.title">\n          <dt>{{ f.title }}</dt>\n          <dd>\n            <select v-model="getSelectVoices[index]">\n              <option v-for="v in voiceArray" :key="v" :value="v[1]">{{ v[0] }}</option>\n            </select>\n            <label class="voicesOnOff">\n              <input type="checkbox" :input-value="getSelectVoicesOnOff[index]" :checked="getSelectVoicesOnOff[index]" @change="onChangeOnOff(index)">\n              <span>自動再生：音声{{ selectVoicesOnOffText[index] }}</span>\n            </label>\n          </dd>\n        </template>\n      </dl>\n    </div>\n    ',deactivated(){let e=this.initialValue.toString()!==this.getSelectVoices.toString(),t=this.initialValueOnOff.toString()!==this.getSelectVoicesOnOff.toString();(e||t)&&(this.updateSelectVoices(this.getSelectVoices,this.getSelectVoicesOnOff),localStorage.setItem("voices",JSON.stringify(this.getSelectVoices)),localStorage.setItem("voicesOnOff",JSON.stringify(this.getSelectVoicesOnOff)))},methods:{onChangeOnOff(e){this.getSelectVoicesOnOff[e]=!this.getSelectVoicesOnOff[e],this.selectVoicesOnOffText[e]=this.getSelectVoicesOnOff[e]?"オン":"オフ"}},created(){this.initialValue=this.getSelectVoices.map((e=>e)),this.initialValueOnOff=this.getSelectVoicesOnOff.map((e=>e)),this.selectVoicesOnOffText=this.getSelectVoicesOnOff.map((e=>e?"オン":"オフ"))}}).use(VueScrollTo).mount(".v-container")}();