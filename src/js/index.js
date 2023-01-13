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
          'register': '単語を登録する'
        },
        getAllWords : [],
        isNowPlaying: false
      };
    },
    provide() {
      return {
        getAllWords: Vue.computed(()=>this.getAllWords),
        isNowPlaying: Vue.computed(()=>this.isNowPlaying),
        updateIsNowPlaying: this.updateIsNowPlaying
      }
    },
    methods: {
      onClick(aKey) {
        this.current = aKey;
      },
      updateIsNowPlaying() {
        this.isNowPlaying = !this.isNowPlaying;
      }
    },
    computed: {
      currentPage() {
        return `page-${this.current}`;
      }
    },
    created() {
      let getAllWords = JSON.parse(localStorage.getItem('allWords')) || [];

      if(getAllWords.length<10) {
        this.current = 'register';
      }

      // 最初に覚えたものと覚えていないものを分けた後に、ランダムで最大10個抜き出す
      // 通し番号を入れておく
      getAllWords.forEach((word,index) => word[5] = index);
      localStorage.setItem('allWords', JSON.stringify(getAllWords));

      this.getAllWords = getAllWords;

    },
  })
  .component('page-memorize', {
    data() {
      return {
        name: ''
      }
    },
    template: `<div>
    <h2>単語を覚える</h2>
    <p>単語を１０個覚えましょう。</p>
    <memorize-vocabulary></memorize-vocabulary>
    </div>`
  })
  .component('memorize-vocabulary', {
    inject: [ 'getAllWords', 'isNowPlaying', 'updateIsNowPlaying' ],
    data() {
      return {
        isAuto: false,
        isManual: false,
        random10WordsIndex: [],
        displayWords: '',
        intervalTimerArray: [],
        countUp: 0,
        num: {
          speed: 0,
          order: 0,
          stopped: 0,
        },
        label: {
          speed: ['少し遅め', '少し速め'],
          order: ['単語→意味', '意味→単語'],
          stopped: ['停止する', '再開する'],
        },
        index: {
          speed: [0,1],
          order: [0,1],
          stopped: [0,1],
        },
        autoSpeed: [
          [ 3, 7, 11, 15 ],
          [ 2, 4, 6, 8 ]
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
        manualOrderIndexArray: [
          [0,1,2,3],[1,0,3,2]
        ],
        isUnselected: true,
        questionWord: '',
        questionWordArray: ['単語', '文章']
      }
    },
    mounted() {
      this.getRandom10WordsIndex();
    },
    template: `
      <div class="displayWords" v-if="isAuto">
        <template v-if="isComplete">
          <p>単語を全て覚えました。覚えた単語は下記です。</p>
          <ul>
            <li v-for="word in alreadyMemorized10Words">{{ word[0] }} - {{ word[1] }}</li>
          </ul>
        </template>
        <template v-else>
          <div class="displayWords__smallBtn">
            <small>現在の表示順：{{ label.order[index.order[0]] }}</small>　<button @click="onReverse">{{ label.order[index.order[1]] }}に変更</button><br />
            <small>現在の速度：{{ label.speed[index.speed[0]] }}</small>   <button @click="onChangeSpeed">{{ label.speed[index.speed[1]] }}に変更</button>
          </div>
          <p class="displayWords__word">
            {{ displayWords }}
          </p>
          <div class="displayWords__btn">
            <template v-if="isAuto">
              <template v-if="isStopped">
                <p><small>停止中</small></p>
              </template>
              <button @click="onAlreadyMemorized" :disabled="isStopped">もう覚えた</button>
              <button @click="onStop">{{ label.stopped[index.stopped[0]] }}</button>
              <p><small>再生中の単語を覚えたと思ったら、「もう覚えた」ボタンを押してね。</small></p>
              <p><small>覚えた単語 {{ alreadyMemorized10Words.length }}/10個</small></p>
            </template>
          </div>
        </template>
      </div>
      <div v-if="isManual">
        <template v-if="isComplete">
          <p>正答率 {{ percent }}%</p>
          <ul>
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
          <button @click="onPlayAgain">もう一度チャレンジする</button>
        </div>
      </template>
      <template v-else>
        <div class="displayWords__commonBtn" v-if="!isAuto && !isManual">
          <button @click="onAutoPlay">自動再生</button>
          <button @click="onManualPlay">テスト形式</button>
        </div>
        <div class="displayWords__commonBtn" v-else>
          <button @click="onPlayAgain">最初からやり直す</button>
        </div>
      </template>
    `,
    methods: {
      onAutoPlay() {
        this.isAuto = true;
        this.isManual = false;
        this.countUp = 0;
        this.randomNo = this.getRandomIndex();
        this.displayWords = this.allWords[this.random10WordsIndex[this.randomNo]][0];
        this.updateIsNowPlaying();
        this.autoPlay();
      },
      autoPlay() {
        this.intervalTimerArray.push(setInterval((function() {
          ++this.countUp;
          this.displayWords = this.getWord(this.autoSpeed[this.index.speed[0]], this.allWords[this.random10WordsIndex[this.randomNo]]);
        }).bind(this), 1000));
      },
      getWord(aAutoSpeed, aDisplayWordArray) {
        if(this.countUp<aAutoSpeed[0]) {
          return (!this.index.order[0]) ? aDisplayWordArray[0] : aDisplayWordArray[1];
        }
        if(this.countUp<aAutoSpeed[1]) {
          return (!this.index.order[0]) ? aDisplayWordArray[1] : aDisplayWordArray[0];
        }
        if(this.countUp<aAutoSpeed[2]) {
          return (!this.index.order[0]) ? aDisplayWordArray[2] : aDisplayWordArray[3];
        }
        if(this.countUp<aAutoSpeed[3]) {
          return (!this.index.order[0]) ? aDisplayWordArray[3] : aDisplayWordArray[2];
        }
        this.randomNo = this.getRandomIndex();
        this.countUp = 0;
        return (!this.index.order[0]) ? this.allWords[this.random10WordsIndex[this.randomNo]][0] : this.allWords[this.random10WordsIndex[this.randomNo]][1];
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
      onChangeSpeed() {
        this.index.speed = [this.num.speed=1-this.num.speed,1-this.num.speed];
      },
      onReverse() {
        this.index.order = [this.num.order=1-this.num.order,1-this.num.order];
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
        }
        else {
          // 残った単語で自動再生を始める
          this.countUp = 0;
          this.onAutoPlay();
        }
      },
      onPlayAgain() {
        this.isComplete = false;
        this.isAuto = false;
        this.isManual = false;
        this.isUnselected = true;
        this.alreadyMemorized10Words = [];
        this.getRandom10WordsIndex();
        this.updateIsNowPlaying();
      },
      onManualPlay() {
        this.isManual = true;
        this.isAuto = false;
        this.isCorrectArray = [];
        this.updateIsNowPlaying();
      },
      onSelectOrder(aOrder) {
        this.isUnselected = false;
        this.manualOrder = (aOrder) ? 0 : 1;//普通の順番でスタート
        this.questionWord = this.questionWordArray[0];
        this.displayWords = this.allWords[this.random10WordsIndex[this.manualIndex.cnt]][this.manualOrderIndexArray[this.manualOrder][this.manualIndex.cnt2]];
      },
      onNext() {//押すとcnt2は奇数になる
        ++this.manualIndex.cnt2;
        this.isQuestion = false;
        this.displayWords = this.allWords[this.random10WordsIndex[this.manualIndex.cnt]][this.manualOrderIndexArray[this.manualOrder][this.manualIndex.cnt2]];
      },
      onJudge(aIsCorrect) {//押すとcnt2はcnt2は偶数になる
        // 正解したかどうかを判定する「単語の意味を頭に思い浮かべてください」
        // 正解true 不正解false
        this.isCorrectArray.push(aIsCorrect);
        this.isQuestion = true;

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
        if(this.isCorrectArray.length===20) {
          this.isComplete = true;
          this.manualIndex.cnt = 0;
          this.percent = this.isCorrectArray.filter(data=>data).length/this.isCorrectArray.length*100;
          localStorage.setItem('allWords', JSON.stringify(this.allWords));
        }
        else {
          this.displayWords = this.allWords[this.random10WordsIndex[this.manualIndex.cnt]][this.manualOrderIndexArray[this.manualOrder][this.manualIndex.cnt2]];
          this.questionWord = (!this.manualIndex.cnt2) ? this.questionWordArray[0] : this.questionWordArray[1];
        }

      },
      getRandom10WordsIndex() {
        let randomIndex = 0;
        let getRandom10Words = [];

        let alreadyMemorizedWords = this.allWords.filter(data=>data[4]);
        let notYetMemorizedWords = this.allWords.filter(data=>!data[4]);

        if(notYetMemorizedWords.length<10) {
          //まだ覚えていない単語が10個より少ない時
          // 覚えた単語の日付の古いものから取得する
          alreadyMemorizedWords.sort(
            function(a,b) {
              return a[4] > b[4] ? 1 : -1;
            }
          );
          let additionArrayLength = 10-notYetMemorizedWords.length;
          getRandom10Words = notYetMemorizedWords.concat(alreadyMemorizedWords.slice(0,additionArrayLength));
        }
        else {
          for(let cnt=0,len=notYetMemorizedWords.length;cnt<10;++cnt,--len) {
            randomIndex = Math.floor( Math.random() * len);
            getRandom10Words.push(notYetMemorizedWords.splice(randomIndex,1)[0]);
          }
        }

        let getRandom10WordsIndex = getRandom10Words.map(data=>data=data[5]);
        this.random10WordsIndex = getRandom10WordsIndex;
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
      <h2>単語を登録する</h2>
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
    inject: [ 'getAllWords' ],
    data() {
      return {
        input: ['','','',''],
        alert: ['','','',''],
        isDisabled: true,
        isAdded: false,
        allWords: this.getAllWords,
        wordList: '#wordList'
      }
    },
    template: `<div id="top">
      <div class="btn--right"><button v-scroll-to="wordList">登録済みの<br />単語リスト</button></div>
      <h3>新規登録</h3>
      <dl class="form">
        <dt>単語<small class="required">※必須 {{ alert[0] }}</small></dt>
        <dd><input type="text" size="30" v-model="input[0]" /><br /><small>例）apple</small></dd>
        <dt>単語の意味<small class="required">※必須 {{ alert[1] }}</small></dt>
        <dd><input type="text" size="30" v-model="input[1]" /><br /><small>例）りんご</small></dd>
        <dt>例文<small class="required">※必須 {{ alert[2] }}</small></dt>
        <dd><textarea cols="30" rows="5" v-model="input[2]"></textarea><br><small>例）I like apples.</small></dd>
        <dt>例文の意味<small class="required">※必須 {{ alert[3] }}</small></dt>
        <dd><textarea cols="30" rows="5" v-model="input[3]"></textarea><br><small>例）私はりんごが好きです。</small></dd>
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
        // 下記の新規登録した際の通し番号をどう入れる？　***後で検討
        this.input[4] = 0;
        this.input[5] = '';

        this.allWords.push(this.input);
        localStorage.setItem('allWords', JSON.stringify(this.allWords));

        this.input = ['','','',''];
        this.isAdded = true;
      }
    },
    mixins: [ formAlerts ]
  })
  .component('register-list',{
    inject: [ 'getAllWords' ],
    emits: [ 'judgeIsNotEdit' ],
    data() {
      return {
        allWords: this.getAllWords,
        top: '#top'
      }
    },
    template: `<div v-if="allWords.length>=10" id="wordList">
      <h3>まだ覚えていない単語</h3>
      <ul class="list">
        <template v-for="(word, index) in allWords" :key="word">
        <li v-if="!word[4]" @click="onEdit(index)">{{ word[0] }}</li>
        </template>
      </ul>
      <h3>既に覚えた単語</h3>
      <ul class="list">
        <template v-for="(word, index) in allWords" :key="word">
        <li v-if="word[4]" @click="onEdit(index)">{{ word[0] }}</li>
        </template>
      </ul>
      <div class="btn--right"><button v-scroll-to="top">ページトップへ</button></div>
    </div>`,
    methods: {
      onEdit(aIndex) {
        this.$emit('judgeIsNotEdit', aIndex);
      }
    }
  })
  .component('list-edit',{
    inject: [ 'getAllWords' ],
    props: [ 'editIndex' ],
    emits: [ 'judgeIsNotEdit' ],
    data() {
      return {
        allWords: this.getAllWords,
        hasAlreadyMemorized: false,
        registerDate: 0,
        isDisabled: true,
        alert: [ '','','','' ],
        isAuto: this.isAuto,
        input : []
      }
    },
    template: `<div>
      <h3>単語の編集</h3>
      <dl class="form">
        <dt>単語<small class="required">※必須 {{ alert[0] }}</small></dt>
        <dd><input type="text" size="30" v-model="input[0]" /><br /><small>例）apple</small></dd>
        <dt>単語の意味<small class="required">※必須 {{ alert[1] }}</small></dt>
        <dd><input type="text" size="30" v-model="input[1]" /><br /><small>例）りんご</small></dd>
        <dt>例文<small class="required">※必須 {{ alert[2] }}</small></dt>
        <dd><textarea cols="40" rows="5" v-model="input[2]"></textarea><br><small>例）I like apples.</small></dd>
        <dt>例文の意味<small class="required">※必須 {{ alert[3] }}</small></dt>
        <dd><textarea cols="40" rows="5" v-model="input[3]"></textarea><br><small>例）私はりんごが好きです。</small></dd>
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
      },
      onUnchange() {
        this.$emit('judgeIsNotEdit');
      },
      onDelete(aEditIndex) {
        this.allWords.splice(aEditIndex,1);
        localStorage.setItem('allWords', JSON.stringify(this.allWords));
        this.$emit('judgeIsNotEdit');
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
  .use(VueScrollTo)
  .mount('.v-container');
