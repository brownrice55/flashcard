(function() {
  'use strict';

  const formAlerts = {
    methods: {
      alerts() {
        for(let cnt=0,len=this.input.length;cnt<len;++cnt) {
          this.alert[cnt] = this.input[cnt] ? '' : '入力してください';
          this.formInputClass[cnt] = this.input[cnt] ? '' : 'input--alert';
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

  const app = Vue.createApp({
    data() {
      return {
        current: 'memorize',
        pages: {
          'memorize': '単語を覚える',
          'register': '登録',
          'settings': '設定'
        },
        listIcons: {
          'memorize': 'fa-home',
          'register': 'fa-pen',
          'settings': 'fa-wrench'
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
        this.getAndSetAllWordsPlusNo(aAllWords);
      },
      getAndSetAllWordsPlusNo(aAllWords) {
        this.getAllWords = aAllWords;

        if(this.getAllWords.length<10) {
          this.current = 'register';
        }
        // 通し番号を入れておく
        this.getAllWords.forEach((word,index) => word[5] = index);

        // ローカルストレージにセットする
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
      updateSelectVoices(aSelectVoices, aSelectVoicesOnOff) {
        this.getSelectVoices = aSelectVoices;
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

      this.getAndSetAllWordsPlusNo(this.getAllWords);

      if('speechSynthesis' in window) {//音声対応のブラウザの時に取得
        let getSelectVoices = JSON.parse(localStorage.getItem('voices')) || ['en-GB', 'ja-JP', 'en-GB', 'ja-JP'];
        if(getSelectVoices.length<1) {
          getSelectVoices = ['en-GB', 'ja-JP', 'en-GB', 'ja-JP'];
        }
        this.getSelectVoices = getSelectVoices;

        let getSelectVoicesOnOff = JSON.parse(localStorage.getItem('voicesOnOff')) || [true, false, true, false];
        if(getSelectVoicesOnOff.length<1) {
          getSelectVoicesOnOff = [true, false, true, false];
        }
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
    inject: [ 'getAllWords', 'updateAllWords' ],
    template: `<div>
    <h1 class="title--h1">単語を覚えよう</h1>
    <div v-if="isDisplaySelect" class="howmany">
      単語をいくつ覚えますか？
      <div class="howmany__select">
        <select v-model.number="getNum">
          <option v-for="n in nums" :key="n">{{ n }}</option>
        </select>
      </div>
      個
    </div>
    <memorize-vocabulary></memorize-vocabulary>
    </div>`,
    created() {
      this.nums = this.getNums();
    },
    activated() {
      this.nums = this.getNums();
      this.updateAllWords(this.getAllWords);
    },
    methods: {
      updateIsDisplaySelect(aBoolean) {
        this.isDisplaySelect = aBoolean;
      },
      getNums() {
        let allWordsLength = Math.floor(this.getAllWords.length/5);
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
        randomWordsIndex: [],
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
        volumeClass: '',
        isOnOrOff: '',
        doneWordsNum: 0
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
            <li>表示順:
              <div  class="displayWords__select">
                <select v-model="index.order">
                  <option v-for="(order,index) in label.order" :key="order" :value="index">{{ order }}</option>
                </select>
              </div>
            </li>
            <li class="displayWords__conditions--speed">
              <label><span>表示速度: <small>遅い</small></span><input class="displayWords__range" type="range" min="0" max="4" step="1" v-model="speedRangeIndex"><span><small>速い</small></span></label>
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
              <div class="btnWrap">
                <button class="btnWrap--btn" @click="onAlreadyMemorized" :disabled="isStopped"><span>もう覚えた</span></button>
              </div>
              <div class="btnWrap">
                <button class="btnWrap--btn" @click="onStop"><span>{{ label.stopped[index.stopped[0]] }}</span></button>
              </div>
              <p class="attention">再生中の単語を覚えたら「もう覚えた」ボタンを押してね。</p>
              <p>覚えた単語 {{ alreadyMemorized10Words.length }}/{{ memorizeWordNum }}個</p>
            </template>
          </div>
        </template>
      </div>
      <div v-if="isManual">
        <template v-if="isComplete">
          <h2 class="title--h2">テストの正答率 {{ percent }}%</h2>
          <ul class="resultList">
            <li v-for="(word, index) in randomWordsIndex" :key="word">
              <p><span class="complete__icon" :class="isCorrectLabel.class[judgeCorrectIndex(isCorrectArray[index*2])]">{{ isCorrectLabel.text[judgeCorrectIndex(isCorrectArray[index*2])] }}</span>　{{ getAllWords[word][0] }} - {{ getAllWords[word][1] }}</p>
              <p><span class="complete__icon" :class="isCorrectLabel.class[judgeCorrectIndex(isCorrectArray[index*2+1])]">{{ isCorrectLabel.text[judgeCorrectIndex(isCorrectArray[index*2+1])] }}</span>　{{ getAllWords[word][2] }} - {{ getAllWords[word][3] }}</p>
            </li>
          </ul>
        </template>
        <template v-else>
          <h2 class="title--h2">テスト</h2>
          <template v-if="isUnselected">
            <div>
              <div class="btnWrap">
                <button class="btnWrap--btn" @click="onSelectOrder(true)"><span>単語の意味を覚えたかテスト<br>単語→意味の順番</span></button>
              </div>
              <div class="btnWrap">
                <button class="btnWrap--btn" @click="onSelectOrder(false)"><span>意味から単語が分かるかテスト<br>意味→単語の順番</span></button>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="displayWords">
              <p v-if="isQuestion">下記の<template v-if="this.manualOrder">意味の</template>{{ questionWord }}<template v-if="!this.manualOrder">の意味</template>を思い浮かべてから、「次へ」を押してください。</p>
              <p v-else>正解の時は「正解」を、間違っていたら「不正解」を押してください。</p>
              <p class="displayWords__word">
                {{ displayWords }}
                <template v-if="getSelectVoices.length>0">
                  <br><span @click="onReadAloud"><i class="fa volumeIcon" :class="volumeClass" aria-hidden="true"></i></span>
                </template>
              </p>

              <template v-if="isQuestion">
                <div class="btnWrap">
                  <button class="btnWrap--btn" @click="onNext"><span>次へ</span></button>
                </div>
              </template>
              <template v-else>
                <div class="btnWrap">
                  <button class="btnWrap--btn" @click="onJudge(true)"><span>正解</span></button>
                </div>
                <div class="btnWrap">
                  <button class="btnWrap--btn" @click="onJudge(false)"><span>不正解</span></button>
                </div>
              </template>
              <p>現在 {{ doneWordsNum }}/{{ memorizeWordNum }}個目</p>
            </div>
          </template>
        </template>
      </div>
      <template v-if="isComplete">
        <div class="btnWrap">
          <button class="btnWrap--btn" @click="onPlayAgain"><span><template v-if="isAuto">自動再生</template><template v-else>テスト</template>を終了する</span></button>
        </div>
      </template>
      <template v-else>
        <template v-if="!isAuto && !isManual">
          <div class="btnWrap">
            <button class="btnWrap--btn" @click="onStart('auto')"><span>自動再生</span></button>
          </div>
          <div class="btnWrap">
            <button class="btnWrap--btn" @click="onStart('manual')"><span>テスト</span></button>
          </div>
        </template>
        <template v-else>
          <div class="btnWrap">
            <button class="btnWrap--btn" @click="onPlayAgain"><span>最初からやり直す</span></button>
          </div>
        </template>
      </template>
      <p v-if="getSelectVoicesOnOff.length>0 && !isNowPlaying" class="attention">現在、自動再生の音声は{{ isOnOrOff }}になっています。<br>上のナビの「設定」から変更できます。</p>
    `,
    created() {
      this.isOnOrOff = (this.getSelectVoicesOnOff.some(val=>val)) ? 'オン' : 'オフ';
    },
    activated() {
      this.isOnOrOff = (this.getSelectVoicesOnOff.some(val=>val)) ? 'オン' : 'オフ';
    },
    methods: {
      onStart(aType) {
        this.memorizeWordNum = this.getNum;
        this.randomWordsIndex = this.getRandomWordsIndex();
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
        this.displayWords = this.getAllWords[this.randomWordsIndex[this.randomNo]][0];
        if(this.getSelectVoices.length>0) {
          this.volumeClass = (this.getSelectVoicesOnOff[0]) ? 'fa-volume-up' : '';
        }
        this.updateIsNowPlaying(true);
        this.updateIsDisplaySelect(false);
        this.autoPlay();
      },
      autoPlay() {
        this.intervalTimerArray.push(setInterval((function() {
          this.displayWords = this.getWord(this.autoSpeed[this.speedRangeIndex], this.getAllWords[this.randomWordsIndex[this.randomNo]], this.orderIndexArray[this.index.order]);
          new Promise(resolve => {
            if(this.getSelectVoices.length>0) {
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
        if(this.getSelectVoicesOnOff[aOrderIndexArray[aIndex]]) {
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
        this.volumeClass = (this.getSelectVoicesOnOff[0]) ? 'fa-volume-up' : '';
        this.countUp = 0;
        this.randomNo = this.getRandomIndex();
        return this.getAllWords[this.randomWordsIndex[this.randomNo]][0];
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
        return parseInt(Math.random() * this.randomWordsIndex.length);
      },
      onAlreadyMemorized() {
        // 自動再生を止める
        clearInterval(this.intervalTimerArray.shift());

        // allwordsの該当する単語の[4]に現在時刻を入れる
        this.getAllWords[this.randomWordsIndex[this.randomNo]][4] = this.getNow();

        // 上記の変更を全体に反映する
        this.updateAllWords(this.getAllWords);

        // 該当する単語をalreadyMemorized10Wordsにプッシュして10wordsから削除する
        this.alreadyMemorized10Words.push(this.getAllWords[this.randomWordsIndex[this.randomNo]]);
        this.randomWordsIndex.splice(this.randomNo, 1);
        if(!this.randomWordsIndex.length) {
          // 10wordsが空になった場合は、「下記の単語を全て覚えました」と、alreadyMemorized10Wordsを表示する
          this.isComplete = true;
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
        this.doneWordsNum = 0;
        this.isQuestion = true;
        this.volumeClass = 'fa-volume-off';
        this.updateIsNowPlaying(true);
        this.updateIsDisplaySelect(false);
      },
      onSelectOrder(aOrder) {
        this.isUnselected = false;
        this.manualOrder = (aOrder) ? 0 : 1;//普通の順番でスタート
        this.questionWord = this.questionWordArray[0];
        this.displayWords = this.getAllWords[this.randomWordsIndex[this.manualIndex.cnt]][this.orderIndexArray[this.manualOrder][this.manualIndex.cnt2]];
      },
      onNext() {//押すとcnt2は奇数になる
        ++this.manualIndex.cnt2;
        this.isQuestion = false;
        this.volumeClass = 'fa-volume-off';
        this.displayWords = this.getAllWords[this.randomWordsIndex[this.manualIndex.cnt]][this.orderIndexArray[this.manualOrder][this.manualIndex.cnt2]];
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
          this.getAllWords[this.randomWordsIndex[this.manualIndex.cnt]][4] = (isCorrectArrayNow[0] && isCorrectArrayNow[1]) ? this.getNow() : 0;
          ++this.doneWordsNum;
        }

        // 次の表示のための準備
        if(this.manualIndex.cnt2===3) {
          this.manualIndex.cnt2 = 0;
          ++this.manualIndex.cnt;
        }
        else {
          this.manualIndex.cnt2 = 2;
        }

        // 全部問題を出し終わったら、正誤表を出す
        if(this.isCorrectArray.length===Number(this.memorizeWordNum)*2) {
          this.isComplete = true;
          this.manualIndex.cnt = 0;
          this.doneWordsNum = 0;
          this.percent = Math.round(this.isCorrectArray.filter(data=>data).length/this.isCorrectArray.length*100);
          this.updateAllWords(this.getAllWords);
        }
        else {
          this.displayWords = this.getAllWords[this.randomWordsIndex[this.manualIndex.cnt]][this.orderIndexArray[this.manualOrder][this.manualIndex.cnt2]];
          this.questionWord = (!this.manualIndex.cnt2) ? this.questionWordArray[0] : this.questionWordArray[1];
        }
      },
      onReadAloud(aIndex) {
        const uttr = new SpeechSynthesisUtterance();
        uttr.text = this.displayWords;
        if(this.isAuto) {
          uttr.lang = this.getSelectVoices[this.orderIndexArray[this.index.order][aIndex]];
          let rateArray = [0.8,1,1,2,3];
          uttr.rate = rateArray[this.speedRangeIndex];
        }
        else if(this.isManual) {
          uttr.lang = this.getSelectVoices[this.orderIndexArray[this.manualOrder][this.manualIndex.cnt2]];
          this.volumeClass = 'fa-volume-up';
        }
        window.speechSynthesis.speak(uttr);
      },
      getRandomWordsIndex() {
        let randomIndex = 0;
        let getRandomWordsIndex = [];

        let notYetMemorizedWords = this.getNotYetMemorizedWords.map(data=>data[5]);

        if(notYetMemorizedWords.length<Number(this.memorizeWordNum)) {
          //まだ覚えていない単語が選択した数より少ない時
          // 覚えた単語の日付の古いものから取得する
          let alreadyMemorizedWords = this.getAlreadyMemorizedWords.map(data=>data);
          alreadyMemorizedWords.sort(
            function(a,b) {
              return a[4] > b[4] ? 1 : -1;
            }
          );
          alreadyMemorizedWords = alreadyMemorizedWords.map(data=>data[5]);

          let additionArrayLength = Number(this.memorizeWordNum)-notYetMemorizedWords.length;
          let selectedWordsFromAlready = alreadyMemorizedWords.slice(0,additionArrayLength);
          getRandomWordsIndex = notYetMemorizedWords.concat(selectedWordsFromAlready);
          // 単語をシャッフルする
          getRandomWordsIndex = this.shuffleWords(getRandomWordsIndex);
        }
        else {
          for(let cnt=0,len=notYetMemorizedWords.length;cnt<Number(this.memorizeWordNum);++cnt,--len) {
            randomIndex = Math.floor( Math.random() * len);
            getRandomWordsIndex.push(notYetMemorizedWords.splice(randomIndex,1)[0]);
          }
        }
        return getRandomWordsIndex;
      },
      shuffleWords(aRandomWords) {
        let randomIndex,lastWord,selectedWord;
          for(let cnt=0,len=aRandomWords.length;cnt<len;--len) {
            randomIndex = Math.floor(Math.random()*len);
            lastWord = aRandomWords[len-1];
            selectedWord = aRandomWords[randomIndex];
            aRandomWords.splice(len-1,1,selectedWord);
            aRandomWords.splice(randomIndex,1,lastWord);
          }
        return aRandomWords;
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
        wordList: '#wordList',
        formInputClass: Array(4).fill('')
      }
    },
    template: `<div>
      <h2 class="title--h2">新規登録</h2>
      <p v-if="getAllWords.length<10" class="attention">最初に10個以上、単語を登録してください。</p>
      <div class="form">
        <div class="form__wrap" v-for="(f,index) in formText" :key="f.title">
          <label for="f.title" class="form__label">{{ f.title }} </label>
          <template v-if="index<2">
            <input type="text" size="30" v-model.trim="input[index]" :class="formInputClass[index]" :placeholder="'例）' + f.example">
          </template>
          <template v-else>
            <textarea cols="30" rows="5" v-model.trim="input[index]" :class="formInputClass[index]" :placeholder="'例）' + f.example"></textarea>
          </template>
          <div class="required">{{ alert[index] }}</div>
        </div>
      </div>
      <div class="btnWrap">
        <button class="btnWrap--btn" @click="onRegister" :disabled="isDisabled"><span>単語を登録する</span></button>
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

        this.getAllWords.push(this.input);

        this.input = Array(4).fill('');
        this.isAdded = true;
        this.updateAllWords(this.getAllWords);
      }
    },
    mixins: [ formAlerts ]
  })
  .component('register-list',{
    inject: [ 'getNotYetMemorizedWords', 'getAlreadyMemorizedWords', 'updateAllWords', 'getAllWords' ],
    emits: [ 'judgeIsNotEdit' ],
    data() {
      return {
        top: '#top',
        toTopActive: ''
      }
    },
    activated() {
      this.updateAllWords(this.getAllWords);
    },
    template: `<div id="wordList">
      <h2 class="title--h2">覚えていない単語 {{ getNotYetMemorizedWords.length }}個</h2>
      <template v-if="getNotYetMemorizedWords.length>0">
        <ul class="list">
          <li v-for="word in getNotYetMemorizedWords" :key="word" @click="onEdit(word[5])">{{ word[0] }}</li>
        </ul>
      </template>
      <template v-else>
        <p class="attention">まだ覚えていない単語はありません。</p>
      </template>
      <h2 class="title--h2">覚えた単語 {{ getAlreadyMemorizedWords.length }}個</h2>
      <template v-if="getAlreadyMemorizedWords.length>0">
        <ul class="list">
          <li v-for="word in getAlreadyMemorizedWords" :key="word" @click="onEdit(word[5])">{{ word[0] }}</li>
        </ul>
      </template>
      <template v-else>
        <p class="attention">既に覚えた単語はありません。</p>
      </template>
      <button class="toTop" v-scroll-to="top" :class="toTopActive">▲</button>
    </div>`,
    methods: {
      onEdit(aIndex) {
        this.$emit('judgeIsNotEdit', aIndex);
      },
      showToTopBtn() {
         if(window.scrollY>400){
           this.toTopActive = 'toTop--active';
         }
         else {
           this.toTopActive = '';
         }
      }
    },
    mounted() {
      window.addEventListener("scroll", this.showToTopBtn);
    }
  })
  .component('list-edit',{
    inject: [ 'getAllWords', 'updateAllWords', 'formText' ],
    props: [ 'editIndex' ],
    emits: [ 'judgeIsNotEdit' ],
    data() {
      return {
        hasAlreadyMemorized: false,
        registerDate: 0,
        isDisabled: true,
        alert: Array(4).fill(''),
        isAuto: this.isAuto,
        input : [],
        formInputClass: Array(4).fill('')
      }
    },
    template: `<div>
      <h2 class="title--h2">単語の編集</h2>
      <div class="form">
        <div class="form__wrap" v-for="(f,index) in formText" :key="f.title">
          <label for="f.title" class="form__label">{{ f.title }} </label>
          <template v-if="index<2">
            <input type="text" size="30" v-model.trim="input[index]" :class="formInputClass[index]" :placeholder="'例）' + f.example">
          </template>
          <template v-else>
            <textarea cols="30" rows="5" v-model.trim="input[index]" :class="formInputClass[index]" :placeholder="'例）' + f.example"></textarea>
          </template>
          <div class="required">{{ alert[index] }}</div>
        </div>
        <div>
          <label class="form__input">
            <input type="checkbox" class="form__input--input" v-model="hasAlreadyMemorized" @change="onChangeCheck">
            <span class="form__input--inputDummy"></span>
            <span class="form__input--text">この単語を覚えた<template v-if="hasAlreadyMemorized">（{{ registerDate }}）</template></span>
          </label>
        </div>
      </div>
      <div class="btnWrap">
        <button class="btnWrap--btn" @click="onChange(editIndex)" :disabled="isDisabled"><span>変更を保存する</span></button>
      </div>
      <div class="btnWrap">
        <button class="btnWrap--btn" @click="onUnchange()"><span>変更をキャンセルする</span></button>
      </div>
      <div class="btnWrap">
        <button class="btnWrap--btn" @click="onDelete(editIndex)"><span>この単語を削除する</span></button>
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
        this.registerDate = (this.hasAlreadyMemorized) ? this.getNow() : this.getAllWords[this.editIndex][4];
        this.judgeDisabled();
      },
      onChange(aEditIndex) {
        let inputRegisterData = (this.hasAlreadyMemorized) ? this.registerDate : 0;
        let inputData = this.input.concat([inputRegisterData, this.getAllWords[aEditIndex][5]]);
        this.getAllWords.splice(aEditIndex,1,inputData);
        this.$emit('judgeIsNotEdit');
        this.updateAllWords(this.getAllWords);
      },
      onUnchange() {
        this.$emit('judgeIsNotEdit');
      },
      onDelete(aEditIndex) {
        this.getAllWords.splice(aEditIndex,1);
        this.$emit('judgeIsNotEdit');
        this.updateAllWords(this.getAllWords);
      },
      judgeDisabled() {
        let inputRegisterData = (this.hasAlreadyMemorized) ? this.registerDate : 0;
        let changedArray = this.input.concat([inputRegisterData, this.getAllWords[this.editIndex][5]]);
        let isChanged = (changedArray.toString()!==this.getAllWords[this.editIndex].toString()) ? true : false;
        this.isDisabled = (isChanged || Boolean(this.getAllWords[this.editIndex][4])!==this.hasAlreadyMemorized) ? false : true;
        let isAlert = this.input.some(val=>!val) ? true : false;
        if(isAlert) {
          this.isDisabled = true;
        }
      }
    },
    mounted() {
      this.hasAlreadyMemorized = this.getAllWords[this.editIndex][4] ? true : false;
      this.registerDate = this.getAllWords[this.editIndex][4] ? this.getAllWords[this.editIndex][4] : 0;
      this.input = this.getAllWords[this.editIndex].slice(0,4);
    },
    mixins: [ formAlerts, getNowData ]
  })
  .component('page-settings', {
    inject: [ 'getSelectVoices', 'voiceArray', 'getSelectVoicesOnOff', 'updateSelectVoices', 'formText' ],
    data() {
      return {
        selectVoicesOnOffText: [],
        isDisabled: true,
        initialValue: [],
        initialValueOnOff: [],
      }
    },
    template: `<div>
      <h2 class="title--h2">音声の設定</h2>
      <dl class="form">
        <template v-for="(f, index) in formText" :key="f.title">
          <dt class="form__title">{{ f.title }}</dt>
          <dd>
            <div class="form__select">
              <select v-model="getSelectVoices[index]">
                <option v-for="v in voiceArray" :key="v" :value="v[1]">{{ v[0] }}</option>
              </select>
              <label class="form__input">
                <input type="checkbox" class="form__input--input" :input-value="getSelectVoicesOnOff[index]" :checked="getSelectVoicesOnOff[index]" @change="onChangeOnOff(index)">
                <span class="form__input--inputDummy"></span>
                <span class="form__input--text">自動再生：音声{{ selectVoicesOnOffText[index] }}</span>
              </label>
            </div>
          </dd>
        </template>
      </dl>
    </div>
    `,
    deactivated() {
      let isVoiceChanged = (this.initialValue.toString()!==this.getSelectVoices.toString()) ? true : false;
      let isVoiceOnOffChanged = (this.initialValueOnOff.toString()!==this.getSelectVoicesOnOff.toString()) ? true : false;
      let isChanged = (isVoiceChanged || isVoiceOnOffChanged) ? true : false;

      if(isChanged) {//変更があった場合、更新と保管
        this.updateSelectVoices(this.getSelectVoices, this.getSelectVoicesOnOff);
        localStorage.setItem('voices', JSON.stringify(this.getSelectVoices));
        localStorage.setItem('voicesOnOff', JSON.stringify(this.getSelectVoicesOnOff));
      }
    },
    methods: {
      onChangeOnOff(aIndex) {
        this.getSelectVoicesOnOff[aIndex] = !this.getSelectVoicesOnOff[aIndex];
        this.selectVoicesOnOffText[aIndex] = this.getSelectVoicesOnOff[aIndex] ? 'オン' : 'オフ';
      }
    },
    created() {
      // initialデータは値が変更しないように.mapを使って入れておく
      this.initialValue = this.getSelectVoices.map(data=>data);
      this.initialValueOnOff = this.getSelectVoicesOnOff.map(data=>data);

      this.selectVoicesOnOffText = this.getSelectVoicesOnOff.map(data=>(data ? 'オン' : 'オフ'));
    }
  })
  .use(VueScrollTo)
  .mount('.v-container');

})();
