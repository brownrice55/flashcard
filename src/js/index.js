const formAlerts = {
  methods: {
    alerts() {
      for(let cnt=0;cnt<4;++cnt) {
        this.alert[cnt] = (!this.input[cnt]) ? '入力してください。' : '';
      }
    }
  }
};

const getNowData = {
  methods: {
    getNow() {
      let now = new Date();
      let yyyy = now.getFullYear();
      let mm = now.getMonth() + 1;
      let dd = now.getDate();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      let date = yyyy + '/' + mm + '/' + dd + ' ' + hours + ':' + minutes;
      return date;
    }
  }
};

const app = Vue
  .createApp({
    data() {
      return {
        current: 'memorize',
        pages: {
          'memorize': '単語を覚える',
          'register': '登録',
          'settings': '設定'
        },
        getAllWords: [],
        isNowPlaying: false,
        voiceArray: [
          ['日本語', 'ja-JP'],
          ['英語（イギリス）', 'en-GB'],
          ['英語（アメリカ）', 'en-US'],
          ['英語（オーストラリア）', 'en-AU'],
          ['英語（インド）', 'en-IN'],
          ['フランス語', 'fr-FR'],
          ['イタリア語', 'it-IT'],
          ['ドイツ語', 'de-DE'],
          ['スペイン語', 'es-ES'],
          ['ギリシャ語', 'el-GR'],
          ['韓国語', 'ko-KR'],
          ['ロシア語', 'ru-RU'],
          ['中国語（中国）', 'zh-CN'],
          ['中国語（台湾）', 'zh-TW'],
          ['中国語（香港）', 'zh-HK'],
          ['アラビア語', 'ar-SA'],
        ],
        getSelectVoices: [],
        getSelectVoicesOnOff: [],
        unsupported: 'このブラウザは音声に対応していません。',
        getNotYetMemorizedWords: [],
        getAlreadyMemorizedWords: [],
        formText: [
          { title: '単語', example:'apple'},
          { title: '単語の意味', example:'りんご'},
          { title: '例文', example:'I like apples.'},
          { title: '例文の意味', example:'私はりんごが好きです。'},
        ]
      };
    },
    provide() {
      return {
        getAllWords: Vue.computed(()=>this.getAllWords),
        isNowPlaying: Vue.computed(()=>this.isNowPlaying),
        updateIsNowPlaying: this.updateIsNowPlaying,
        getSelectVoices: Vue.computed(()=>this.getSelectVoices),
        getSelectVoicesOnOff: Vue.computed(()=>this.getSelectVoicesOnOff),
        voiceArray: this.voiceArray,
        updateAllWords: this.updateAllWords,
        getAlreadyMemorizedWords:  Vue.computed(()=>this.getAlreadyMemorizedWords),
        getNotYetMemorizedWords:  Vue.computed(()=>this.getNotYetMemorizedWords),
        updateSelectVoices: this.updateSelectVoices,
        formText: this.formText
      }
    },
    methods: {
      onClick(aKey) {
        this.current = aKey;
      },
      updateIsNowPlaying(aBoolean) {
        this.isNowPlaying = aBoolean;
      },
      updateAllWords(aAllWords) {
        this.allWords = aAllWords;
        this.getAllWordsPlusNo();
      },
      getAllWordsPlusNo() {
        if(this.getAllWords.length<10) {
          this.current = 'register';
        }
        // 通し番号を入れておく
        this.getAllWords.forEach((word,index) => word[5] = index);
        localStorage.setItem('allWords', JSON.stringify(this.getAllWords));


        let getNotYetMemorizedWords = [];
        let getAlreadyMemorizedWords = [];
        // 覚えたものと覚えていないものを分ける
        new Promise(resolve => {
          for(let cnt=0,len=this.getAllWords.length;cnt<len;++cnt) {
            if(this.getAllWords[cnt][4]) {
              getAlreadyMemorizedWords.push(this.getAllWords[cnt]);
            }
            else {
              getNotYetMemorizedWords.push(this.getAllWords[cnt]);
            }
          }
          resolve();
        }).then(()=> {
          this.getAlreadyMemorizedWords = getAlreadyMemorizedWords;
          this.getNotYetMemorizedWords = getNotYetMemorizedWords;
        });
      },
      updateSelectVoices(aSelectVoicesOnOff) {
        this.getSelectVoicesOnOff = aSelectVoicesOnOff;
      }
    },
    computed: {
      currentPage() {
        return `page-${this.current}`;
      }
    },
    created() {
      this.getAllWords = JSON.parse(localStorage.getItem('allWords')) || [];

      this.getAllWordsPlusNo();

      if('speechSynthesis' in window) {//音声対応のブラウザの時に取得
        let getSelectVoices = JSON.parse(localStorage.getItem('voices')) || ['ja-JP', 'en-GB', 'ja-JP', 'en-GB'];
        this.getSelectVoices = getSelectVoices;

        let getSelectVoicesOnOff = JSON.parse(localStorage.getItem('voicesOnOff')) || [true, false, true, false];
        this.getSelectVoicesOnOff = getSelectVoicesOnOff;
      }
      else {
        this.getSelectVoices = [];
        this.getSelectVoicesOnOff = [];
        delete this.pages.settings;
      }
    },
  });
  app.config.unwrapInjectedRef = true;
  app.component('page-memorize', {
    data() {
      return {
        name: '',
        getNum: '5',
        isDisplaySelect: true,
        allWords: this.getAllWords,
        nums: [],
      }
    },
    provide() {
      return {
        isDisplaySelect: Vue.computed(()=>this.isDisplaySelect),
        updateIsDisplaySelect: this.updateIsDisplaySelect,
        getNum: Vue.computed(()=>this.getNum)
      }
    },
    inject: [ 'getAllWords' ],
    template: `<div>
    <h2>単語を覚えよう</h2>
    <div v-if="isDisplaySelect">
      単語をいくつ覚えますか？
      <select v-model.number="getNum" class="selectNum">
        <option v-for="n in nums" :key="n">{{ n }}</option>
      </select>
      個
    </div>
    <memorize-vocabulary></memorize-vocabulary>
    </div>`,
    created() {
      this.nums = this.getNums();
    },
    activated() {
      this.nums = this.getNums();
      this.allWords = this.getAllWords;
    },
    methods: {
      updateIsDisplaySelect(aBoolean) {
        this.isDisplaySelect = aBoolean;
      },
      getNums() {
        let allWordsLength = Math.floor(this.allWords.length/5);
        let nums = [];
        for(let cnt=0;cnt<allWordsLength;++cnt) {
          nums.push(cnt*5+5);
        }
        return nums;
      }
    }
  })
  .component('memorize-vocabulary', {
    inject: [ 'getAllWords', 'isNowPlaying', 'updateIsNowPlaying', 'isDisplaySelect', 'updateIsDisplaySelect', 'getNum', 'getSelectVoices', 'getSelectVoicesOnOff', 'getNotYetMemorizedWords', 'getAlreadyMemorizedWords', 'updateAllWords' ],
    data() {
      return {
        isAuto: false,
        isManual: false,
        random10WordsIndex: [],
        displayWords: '',
        intervalTimerArray: [],
        countUp: 0,
        num: {
          order: 0,
          stopped: 0,
        },
        label: {
          order: ['単語→意味', '意味→単語'],
          stopped: ['停止する', '再開する'],
        },
        index: {
          order: 0,
          stopped: [0,1],
        },
        speedRangeIndex: 2,
        autoSpeed: [
          [ 5, 11, 17, 23 ],
          [ 4, 9, 14, 19 ],
          [ 3, 7, 11, 15 ],
          [ 2, 5, 8, 11 ],
          [ 1, 3, 5, 7 ]
        ],
        randomNo: 0,
        alreadyMemorized10Words: [],
        isComplete: false,
        allWords: this.getAllWords,
        isStopped: false,
        isQuestion: true,
        isCorrectArray: [],
        manualIndex: {
          cnt : 0,
          cnt2: 0,
        },
        judgeCorrectIndex: (aIsCorrectArray) => aIsCorrectArray ? 1 : 0,
        percent: 100,
        isCorrectLabel: {
          text: ['誤', '正'],
          class: ['complete__icon--again', 'complete__icon--ok']
        },
        manualOrder: 0,
        orderIndexArray: [
          [0,1,2,3],[1,0,3,2]
        ],
        isUnselected: true,
        questionWord: '',
        questionWordArray: ['単語', '文章'],
        memorizeWordNum: 5,
        selectVoices: this.getSelectVoices,
        selectVoicesOnOff : this.getSelectVoicesOnOff,
        volumeClass: '',
        isOnOrOff: '',
      }
    },
    template: `
      <div class="displayWords" v-if="isAuto">
        <template v-if="isComplete">
          <p>単語を全て覚えました。覚えた単語は下記です。</p>
          <ul class="resultList">
            <li v-for="word in alreadyMemorized10Words">{{ word[0] }} - {{ word[1] }}</li>
          </ul>
        </template>
        <template v-else>
          <ul class="displayWords__conditions">
            <li>表示順：
              <select v-model="index.order">
                <option v-for="(order,index) in label.order" :key="order" :value="index">{{ order }}</option>
              </select>
            </li>
            <li>表示速度：
              <label>遅い<input type="range" min="0" max="4" step="1" v-model="speedRangeIndex" />速い</label>
            </li>
          </ul>
          <p class="displayWords__word">
            {{ displayWords }}
            <span><i class="fa" :class="volumeClass" aria-hidden="true"></i></span>
          </p>
          <div class="displayWords__btn">
            <template v-if="isAuto">
              <template v-if="isStopped">
                <p><small>停止中</small></p>
              </template>
              <button @click="onAlreadyMemorized" :disabled="isStopped">もう覚えた</button>
              <button @click="onStop">{{ label.stopped[index.stopped[0]] }}</button>
              <p><small>再生中の単語を覚えたと思ったら、「もう覚えた」ボタンを押してね。</small></p>
              <p><small>覚えた単語 {{ alreadyMemorized10Words.length }}/{{ memorizeWordNum }}個</small></p>
            </template>
          </div>
        </template>
      </div>
      <div v-if="isManual">
        <template v-if="isComplete">
          <p>正答率 {{ percent }}%</p>
          <ul class="resultList">
            <li v-for="(word, index) in random10WordsIndex" :key="word">
              <p><span class="complete__icon" :class="isCorrectLabel.class[judgeCorrectIndex(isCorrectArray[index*2])]">{{ isCorrectLabel.text[judgeCorrectIndex(isCorrectArray[index*2])] }}</span>　{{ allWords[word][0] }} - {{ allWords[word][1] }}</p>
              <p><span class="complete__icon" :class="isCorrectLabel.class[judgeCorrectIndex(isCorrectArray[index*2+1])]">{{ isCorrectLabel.text[judgeCorrectIndex(isCorrectArray[index*2+1])] }}</span>　{{ allWords[word][2] }} - {{ allWords[word][3] }}</p>
            </li>
          </ul>
        </template>
        <template v-else>
          <div class="displayWords__btn" v-if="isUnselected">
            <button @click="onSelectOrder(true)">単語の意味を覚えたかテスト<br />単語→意味の順番</button>
            <button @click="onSelectOrder(false)">意味から単語が分かるかテスト<br />意味→単語の順番</button>
          </div>
          <div class="displayWords" v-else>
            <p v-if="isQuestion">下記の<template v-if="this.manualOrder">意味の</template>{{ questionWord }}<template v-if="!this.manualOrder">の意味</template>を思い浮かべてから、「次へ」を押してください。</p>
            <p v-else>正解の時は「正解」を、間違っていたら「不正解」を押してください。</p>
            <p class="displayWords__word">
              {{ displayWords }}
              <template v-if="selectVoices.length>0">
                <br><span @click="onReadAloud"><i class="fa volumeIcon" :class="volumeClass" aria-hidden="true"></i></span>
              </template>
            </p>
            <div v-if="isQuestion" class="displayWords__btn">
              <button @click="onNext">次へ</button>
            </div>
            <div v-else class="displayWords__btn">
              <button @click="onJudge(true)">正解</button>
              <button @click="onJudge(false)">不正解</button>
            </div>
          </div>
        </template>
      </div>
      <template v-if="isComplete">
        <div class="displayWords__commonBtn">
          <button @click="onPlayAgain">上記の単語をセットして終了する</button>
          <p v-if="isAuto" class="attention">全て「覚えた単語」にセットされます。</p>
          <p v-else class="attention">「正」は「覚えた単語」、「誤」は「覚えていない単語」にセットされます。</p>
        </div>
      </template>
      <template v-else>
        <div class="displayWords__commonBtn" v-if="!isAuto && !isManual">
          <button @click="onStart('auto')">自動再生</button>
          <button @click="onStart('manual')">テスト形式</button>
        </div>
        <div class="displayWords__commonBtn" v-else>
          <button @click="onPlayAgain">最初からやり直す</button>
        </div>
      </template>
      <p v-if="selectVoicesOnOff.length>0 && !isNowPlaying" class="attention">現在、自動再生の音声は{{ isOnOrOff }}になっています。<br>上のナビの「設定」から変更できます。</p>
    `,
    mounted() {
      this.isOnOrOff = (this.selectVoicesOnOff.some(val=>val)) ? 'オン' : 'オフ';
    },
    activated() {
      this.isOnOrOff = (this.selectVoicesOnOff.some(val=>val)) ? 'オン' : 'オフ';
    },
    methods: {
      onStart(aType) {
        this.memorizeWordNum = this.getNum;
        this.random10WordsIndex = this.getRandom10WordsIndex();
        if(aType==='auto') {
          this.onAutoPlay();
        }
        else {
          this.onManualPlay();
        }
      },
      onAutoPlay() {
        this.isAuto = true;
        this.isManual = false;
        this.countUp = 0;
        this.randomNo = this.getRandomIndex();
        this.displayWords = this.allWords[this.random10WordsIndex[this.randomNo]][0];
        if(this.selectVoices.length>0) {
          this.volumeClass = (this.selectVoicesOnOff[0]) ? 'fa-volume-up' : '';
        }
        this.updateIsNowPlaying(true);
        this.updateIsDisplaySelect(false);
        this.autoPlay();
      },
      autoPlay() {
        this.intervalTimerArray.push(setInterval((function() {
          this.displayWords = this.getWord(this.autoSpeed[this.speedRangeIndex], this.allWords[this.random10WordsIndex[this.randomNo]], this.orderIndexArray[this.index.order]);
          new Promise(resolve => {
            if(this.selectVoices.length>0) {
              this.getReadAloud(this.autoSpeed[this.speedRangeIndex], this.orderIndexArray[this.index.order]);
            }
            resolve();
          }).then(()=> {
            ++this.countUp;
          });

        }).bind(this), 1000));
      },
      getReadAloud(aAutoSpeed, aOrderIndexArray) {
        if(this.countUp===0) {
          this.getReadAloudState(aOrderIndexArray, 0);
        }
        else if(this.countUp===aAutoSpeed[0]) {
          this.getReadAloudState(aOrderIndexArray, 1);
        }
        else if(this.countUp===aAutoSpeed[1]) {
          this.getReadAloudState(aOrderIndexArray, 2);
        }
        else if(this.countUp===aAutoSpeed[2]) {
          this.getReadAloudState(aOrderIndexArray, 3);
        }
      },
      getReadAloudState(aOrderIndexArray, aIndex) {
        if(this.selectVoicesOnOff[aOrderIndexArray[aIndex]]) {
          this.volumeClass = 'fa-volume-up';
          this.onReadAloud(aIndex);
        }
        else {
          this.volumeClass = '';
        }
      },
      getWord(aAutoSpeed, aDisplayWordArray, aOrderIndexArray) {
        if(this.countUp<aAutoSpeed[0]) {
          return aDisplayWordArray[aOrderIndexArray[0]];
        }
        if(this.countUp<aAutoSpeed[1]) {
          return aDisplayWordArray[aOrderIndexArray[1]];
        }
        if(this.countUp<aAutoSpeed[2]) {
          return aDisplayWordArray[aOrderIndexArray[2]];
        }
        if(this.countUp<aAutoSpeed[3]) {
          return aDisplayWordArray[aOrderIndexArray[3]];
        }
        this.volumeClass = (this.selectVoicesOnOff[0]) ? 'fa-volume-up' : '';
        this.countUp = 0;
        this.randomNo = this.getRandomIndex();
        return this.allWords[this.random10WordsIndex[this.randomNo]][0];
      },
      onStop() {
        this.index.stopped = [this.num.stopped=1-this.num.stopped,1-this.num.stopped];
        this.isStopped = this.index.stopped[0];
        // 停止を押した時に停止する
        if(this.isStopped && this.intervalTimerArray.length>0) {
          clearInterval(this.intervalTimerArray.shift());
        }
        // 再開を押した時に再開する
        if(!this.isStopped) {
          this.autoPlay();
        }
      },
      getRandomIndex() {
        return parseInt(Math.random() * this.random10WordsIndex.length);
      },
      onAlreadyMemorized() {
        // 自動再生を止める
        clearInterval(this.intervalTimerArray.shift());

        // allwordsの該当する単語の[4]に現在時刻を入れる
        this.allWords[this.random10WordsIndex[this.randomNo]][4] = this.getNow();

        // ローカルストレージにも反映する
        localStorage.setItem('allWords', JSON.stringify(this.allWords));

        // 該当する単語をalreadyMemorized10Wordsにプッシュして10wordsから削除する
        this.alreadyMemorized10Words.push(this.allWords[this.random10WordsIndex[this.randomNo]]);
        this.random10WordsIndex.splice(this.randomNo, 1);
        if(!this.random10WordsIndex.length) {
          // 10wordsが空になった場合は、「下記の単語を全て覚えました」と、alreadyMemorized10Wordsを表示する
          this.isComplete = true;
          this.updateAllWords(this.allWords);
        }
        else {
          // 残った単語で自動再生を始める
          this.countUp = 0;
          this.onAutoPlay();
        }
      },
      onPlayAgain() {
        if(this.isAuto && this.intervalTimerArray.length>0) {
          clearInterval(this.intervalTimerArray.shift());
        }
        this.isComplete = false;
        this.isAuto = false;
        this.isManual = false;
        this.isUnselected = true;
        this.alreadyMemorized10Words = [];
        this.updateIsNowPlaying(false);
        this.updateIsDisplaySelect(true);
      },
      onManualPlay() {
        this.isManual = true;
        this.isAuto = false;
        this.isCorrectArray = [];
        this.manualIndex.cnt = 0;
        this.manualIndex.cnt2 = 0;
        this.isQuestion = true;
        this.volumeClass = 'fa-volume-off';
        this.updateIsNowPlaying(true);
        this.updateIsDisplaySelect(false);
      },
      onSelectOrder(aOrder) {
        this.isUnselected = false;
        this.manualOrder = (aOrder) ? 0 : 1;//普通の順番でスタート
        this.questionWord = this.questionWordArray[0];
        this.displayWords = this.allWords[this.random10WordsIndex[this.manualIndex.cnt]][this.orderIndexArray[this.manualOrder][this.manualIndex.cnt2]];
      },
      onNext() {//押すとcnt2は奇数になる
        ++this.manualIndex.cnt2;
        this.isQuestion = false;
        this.volumeClass = 'fa-volume-off';
        this.displayWords = this.allWords[this.random10WordsIndex[this.manualIndex.cnt]][this.orderIndexArray[this.manualOrder][this.manualIndex.cnt2]];
      },
      onJudge(aIsCorrect) {//押すとcnt2はcnt2は偶数になる
        // 正解したかどうかを判定する「単語の意味を頭に思い浮かべてください」
        // 正解true 不正解false
        this.isCorrectArray.push(aIsCorrect);
        this.isQuestion = true;
        this.volumeClass = 'fa-volume-off';

        // 両方正解したものは[4]に時刻をセットして、ローカルストレージにもセットする
        let isCorrectArrayNow = this.isCorrectArray.slice(-2);
        if(this.isCorrectArray.length%2===0) {
          this.allWords[this.random10WordsIndex[this.manualIndex.cnt]][4] = (isCorrectArrayNow[0] && isCorrectArrayNow[1]) ? this.getNow() : 0;
        }

        // 次の表示のための準備
        if(this.manualIndex.cnt2===3) {
          this.manualIndex.cnt2 = 0;
          ++this.manualIndex.cnt;
        }
        else {
          this.manualIndex.cnt2 = 2;
        }

        // 10個出し終わったら、正誤表を出す
        if(this.isCorrectArray.length===Number(this.memorizeWordNum)*2) {
          this.isComplete = true;
          this.manualIndex.cnt = 0;
          this.percent = Math.round(this.isCorrectArray.filter(data=>data).length/this.isCorrectArray.length*100);
          localStorage.setItem('allWords', JSON.stringify(this.allWords));
          this.updateAllWords(this.allWords);
        }
        else {
          this.displayWords = this.allWords[this.random10WordsIndex[this.manualIndex.cnt]][this.orderIndexArray[this.manualOrder][this.manualIndex.cnt2]];
          this.questionWord = (!this.manualIndex.cnt2) ? this.questionWordArray[0] : this.questionWordArray[1];
        }
      },
      onReadAloud(aIndex) {
        const uttr = new SpeechSynthesisUtterance();
        uttr.text = this.displayWords;
        if(this.isAuto) {
          uttr.lang = this.selectVoices[this.orderIndexArray[this.index.order][aIndex]];
          let rateArray = [0.8,1,1,2,3];
          uttr.rate = rateArray[this.speedRangeIndex];
        }
        else if(this.isManual) {
          uttr.lang = this.selectVoices[this.orderIndexArray[this.manualOrder][this.manualIndex.cnt2]];
          this.volumeClass = 'fa-volume-up';
        }
        window.speechSynthesis.speak(uttr);
      },
      getRandom10WordsIndex() {
        let randomIndex = 0;
        let getRandom10Words = [];

        let alreadyMemorizedWords = this.getAlreadyMemorizedWords;
        let notYetMemorizedWords = this.getNotYetMemorizedWords;

        if(notYetMemorizedWords.length<Number(this.memorizeWordNum)) {
          //まだ覚えていない単語が選択した数より少ない時
          // 覚えた単語の日付の古いものから取得する
          alreadyMemorizedWords.sort(
            function(a,b) {
              return a[4] > b[4] ? 1 : -1;
            }
          );
          let additionArrayLength = Number(this.memorizeWordNum)-notYetMemorizedWords.length;
          getRandom10Words = notYetMemorizedWords.concat(alreadyMemorizedWords.slice(0,additionArrayLength));
        }
        else {
          for(let cnt=0,len=notYetMemorizedWords.length;cnt<Number(this.memorizeWordNum);++cnt,--len) {
            randomIndex = Math.floor( Math.random() * len);
            getRandom10Words.push(notYetMemorizedWords.splice(randomIndex,1)[0]);
          }
        }

        let getRandom10WordsIndex = getRandom10Words.map(data=>data=data[5]);
        return getRandom10WordsIndex;
      }
    },
    mixins: [ getNowData ]
  })
  .component('page-register', {
    data() {
      return {
        name: '',
        isNotEdit: true,
        editIndex: this.editIndex
      }
    },
    provide() {
      return {
        isNotEdit: this.isNotEdit
      }
    },
    template: `
    <div v-if="isNotEdit">
      <h2>単語を登録しよう</h2>
      <register-new></register-new>
      <register-list @judgeIsNotEdit="judgeIsNotEdit"></register-list>
    </div>
    <div v-else>
      <list-edit @judgeIsNotEdit="judgeIsNotEdit" :editIndex="editIndex"></list-edit>
    </div>
    `,
    methods: {
      judgeIsNotEdit(aIndex) {
        this.isNotEdit = !this.isNotEdit;
        this.editIndex = aIndex;
      }
    }
  })
  .component('register-new',{
    inject: [ 'getAllWords', 'updateAllWords', 'formText' ],
    data() {
      return {
        input: Array(4).fill(''),
        alert: Array(4).fill(''),
        isDisabled: true,
        isAdded: false,
        allWords: this.getAllWords,
        wordList: '#wordList'
      }
    },
    template: `<div>
      <p v-if="allWords.length<10" class="attention">最初に10個以上、単語を登録してください。</p>
      <div class="btn--right"><button v-scroll-to="wordList">登録済みの<br />単語リスト</button></div>
      <h3>新規登録</h3>
      <dl class="form">
      <template v-for="(f,index) in formText" :key="f.title">
        <dt>{{ f.title }}<small class="required">※必須 {{ alert[index] }}</small></dt>
        <dd v-if="index<2"><input type="text" size="30" v-model="input[index]" /><br /><small>例）{{ f.example }}</small></dd>
        <dd v-else><textarea cols="30" rows="5" v-model="input[index]"></textarea><br><small>例）{{ f.example }}</small></dd>
      </template>
      </dl>
      <div class="displayWords__btn">
        <button @click="onRegister" :disabled="isDisabled">単語を登録する</button>
      </div>
    </div>`,
    watch: {
      input: {
        handler(val) {
          this.isDisabled = (this.input.every(val => val.length>0)) ? false : true;
          if(this.isAdded) {
            this.isAdded = false;
          }
          else {
            this.alerts();
          }
        },
        deep: true
      }
    },
    methods: {
      onRegister() {
        this.input[4] = 0;
        this.input[5] = '';

        this.allWords.push(this.input);
        localStorage.setItem('allWords', JSON.stringify(this.allWords));

        this.input = Array(4).fill('');
        this.isAdded = true;
        this.updateAllWords(this.allWords);
      }
    },
    mixins: [ formAlerts ]
  })
  .component('register-list',{
    inject: [ 'getNotYetMemorizedWords', 'getAlreadyMemorizedWords', 'updateAllWords' ],
    emits: [ 'judgeIsNotEdit' ],
    data() {
      return {
        top: '#top',
      }
    },
    activated() {
      this.updateAllWords(this.allWords);
    },
    template: `<div id="wordList">
      <h3>覚えていない単語</h3>
      <template v-if="getNotYetMemorizedWords.length>0">
        <ul class="list">
          <li v-for="word in getNotYetMemorizedWords" :key="word" @click="onEdit(word[5])">{{ word[0] }}</li>
        </ul>
      </template>
      <template v-else>
        <p class="attention">まだ覚えていない単語はありません。</p>
      </template>
      <h3>覚えた単語</h3>
      <template v-if="getAlreadyMemorizedWords.length>0">
        <ul class="list">
          <li v-for="word in getAlreadyMemorizedWords" :key="word" @click="onEdit(word[5])">{{ word[0] }}</li>
        </ul>
      </template>
      <template v-else>
        <p class="attention">既に覚えた単語はありません。</p>
      </template>
      <div class="btn--right"><button v-scroll-to="top">ページトップへ</button></div>
    </div>`,
    methods: {
      onEdit(aIndex) {
        this.$emit('judgeIsNotEdit', aIndex);
      }
    }
  })
  .component('list-edit',{
    inject: [ 'getAllWords', 'updateAllWords', 'formText' ],
    props: [ 'editIndex' ],
    emits: [ 'judgeIsNotEdit' ],
    data() {
      return {
        allWords: this.getAllWords,
        hasAlreadyMemorized: false,
        registerDate: 0,
        isDisabled: true,
        alert: Array(4).fill(''),
        isAuto: this.isAuto,
        input : []
      }
    },
    template: `<div>
      <h3>単語の編集</h3>
      <dl class="form">
        <template v-for="(f,index) in formText" :key="f.title">
          <dt>{{ f.title }}<small class="required">※必須 {{ alert[index] }}</small></dt>
          <dd v-if="index<2"><input type="text" size="30" v-model="input[index]" /><br /><small>例）{{ f.example }}</small></dd>
          <dd v-else><textarea cols="30" rows="5" v-model="input[index]"></textarea><br><small>例）{{ f.example }}</small></dd>
        </template>
        <dt></dt>
        <dd>
          <label><input type="checkbox" v-model="hasAlreadyMemorized" @change="onChangeCheck" />この単語を覚えた</label>
          <template v-if="hasAlreadyMemorized">（{{ registerDate }}）</template>
        </dd>
      </dl>
      <div class="displayWords__btn">
        <button @click="onChange(editIndex)" :disabled="isDisabled">変更を保存する</button>
        <button @click="onUnchange()">変更をキャンセルする</button><br />
        <button @click="onDelete(editIndex)">この単語を削除する</button>
      </div>
    </div>`,
    watch: {
      input: {
        handler() {
          this.judgeDisabled();
          this.alerts();
        },
        deep: true
      }
    },
    methods: {
      onChangeCheck() {
        this.registerDate = (this.hasAlreadyMemorized) ? this.getNow() : this.allWords[this.editIndex][4];
        this.judgeDisabled();
      },
      onChange(aEditIndex) {
        let inputRegisterData = (this.hasAlreadyMemorized) ? this.registerDate : 0;
        let inputData = this.input.concat([inputRegisterData, this.allWords[aEditIndex][5]]);
        this.allWords.splice(aEditIndex,1,inputData);
        localStorage.setItem('allWords', JSON.stringify(this.allWords));
        this.$emit('judgeIsNotEdit');
        this.updateAllWords(this.allWords);
      },
      onUnchange() {
        this.$emit('judgeIsNotEdit');
      },
      onDelete(aEditIndex) {
        this.allWords.splice(aEditIndex,1);
        localStorage.setItem('allWords', JSON.stringify(this.allWords));
        this.$emit('judgeIsNotEdit');
        this.updateAllWords(this.allWords);
      },
      judgeDisabled() {
        let inputRegisterData = (this.hasAlreadyMemorized) ? this.registerDate : 0;
        let changedArray = this.input.concat([inputRegisterData, this.allWords[this.editIndex][5]]);
        let isChanged = (changedArray.toString()!==this.allWords[this.editIndex].toString()) ? true : false;
        this.isDisabled = (isChanged || Boolean(this.allWords[this.editIndex][4])!==this.hasAlreadyMemorized) ? false : true;
      }
    },
    mounted() {
      this.hasAlreadyMemorized = this.allWords[this.editIndex][4] ? true : false;
      this.registerDate = this.allWords[this.editIndex][4] ? this.allWords[this.editIndex][4] : 0;
      this.input = this.allWords[this.editIndex].slice(0,4);
    },
    mixins: [ formAlerts, getNowData ]
  })
  .component('page-settings', {
    inject: [ 'getSelectVoices', 'voiceArray', 'getSelectVoicesOnOff', 'updateSelectVoices', 'formText' ],
    data() {
      return {
        selectVoices: this.getSelectVoices,
        selectVoicesOnOff: this.getSelectVoicesOnOff,
        selectVoicesOnOffText: (aBoolean) => aBoolean ? 'オン' : 'オフ',
        isDisabled: true,
        selectVoicesOld: this.computedSelectVoices,
        initialValue: [],
        initialValueOnOff: [],
        attention: ''
      }
    },
    template: `<div>
      <h3>音声の設定</h3>
      <dl class="form">
        <template v-for="(f, index) in formText" :key="f.title">
          <dt>{{ f.title }}</dt>
          <dd>
            <select v-model="selectVoices[index]">
              <option v-for="v in voiceArray" :key="v" :value="v[1]">{{ v[0] }}</option>
            </select>
            <label class="voicesOnOff">
              <input type="checkbox" :input-value="selectVoicesOnOff[index]" :checked="selectVoicesOnOff[index]" @change="onChangeOnOff(index)">
              <span>自動再生：音声{{ selectVoicesOnOffText(selectVoicesOnOff[index]) }}</span>
            </label>
          </dd>
        </template>
      </dl>
      <p v-if="attention" class="attention">{{ attention }}</p>
      <div class="displayWords__btn">
        <button @click="onSet" :disabled="isDisabled">設定を変更する</button>
      </div>
    </div>
    `,
    watch: {
      selectVoices: {
        handler() {
          this.judgeDisabled();
        },
        deep: true
      }
    },
    methods: {
      onSet() {
        localStorage.setItem('voices', JSON.stringify(this.selectVoices));
        localStorage.setItem('voicesOnOff', JSON.stringify(this.selectVoicesOnOff));
        this.isDisabled = true;
        this.initialValue = this.selectVoices.map(obj=>obj);
        this.initialValueOnOff = this.selectVoicesOnOff.map(obj=>obj);
        this.updateSelectVoices(this.selectVoicesOnOff);
        this.attention = '';
      },
      judgeDisabled() {
        let isDisabled = (this.initialValue.toString()===this.selectVoices.toString()) ? true : false;
        let isDisabledOnOff = (this.initialValueOnOff.toString()===this.selectVoicesOnOff.toString()) ? true : false;
        this.isDisabled = (isDisabled && isDisabledOnOff) ? true : false;
        this.attention = (this.isDisabled) ? '' : '変更を反映するためには「設定を変更する」ボタンを押してください。';
      },
      onChangeOnOff(aIndex) {
        this.selectVoicesOnOff[aIndex] = !this.selectVoicesOnOff[aIndex];
        this.judgeDisabled();
      }
    },
    created() {
      this.initialValue = this.selectVoices.map(obj=>obj);
      this.initialValueOnOff = this.selectVoicesOnOff.map(obj=>obj);
    }
  })
  .use(VueScrollTo)
  .mount('.v-container');
