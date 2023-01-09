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
        getAllWords : []
      };
    },
    provide() {
      return {
        getAllWords: Vue.computed(()=>this.getAllWords)
      }
    },
    methods: {
      onClick(aKey) {
        this.current = aKey;
      }
    },
    computed: {
      currentPage() {
        return `page-${this.current}`;
      },
    },
    created() {
      let getAllWords = JSON.parse(localStorage.getItem('allWords')) || [];

      if(getAllWords.length<10) {
        this.current = 'register';
        //***　後で対応　この場合は「単語を覚える」のナビも表示させない
      }

      // 最初に覚えたものと覚えていないものを分けた後に、ランダムで最大10個抜き出す
      // indexで判定しても良いかも？　***後で検討
      getAllWords.forEach(function(word,index){
        word[5] = index;
      });
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
    inject: [ 'getAllWords' ],
    data() {
      return {
        isAuto: false,
        isManual: false,
        isInOrder: true,//表示順
        isStopped: false,
        random10WordsIndex: [],
        displayWords: '',
        intervalTimerArray: [],
        countUp: 0,
        autoSpeedArray: [ 3, 7, 11, 15 ],
        isRegularSpeed: true,
        speedLabel: '少し速め',
        speedNow: '少し遅め',
        orderLabel: '意味→単語',
        orderNow: '単語→意味',
        stoppedLabel: '停止する',
        randomNo: 0,
        alreadyMemorized10Words: [],
        isComplete: false,
        allWords: this.getAllWords
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
            <small>現在の表示順：{{ orderNow }}</small>　<button @click="onReverse">{{ orderLabel }}に変更</button><br />
            <small>現在の速度：{{ speedNow }}</small>   <button @click="onChangeSpeed">{{ speedLabel }}に変更</button>
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
              <button @click="onStop">{{ stoppedLabel }}</button>
              <p><small>再生中の単語を覚えたと思ったら、「もう覚えた」ボタンを押してね。</small></p>
              <p><small>覚えた単語 {{ alreadyMemorized10Words.length }}/10個</small></p>
            </template>
          </div>
        </template>
      </div>
      <div v-if="isManual">
        <template v-if="isComplete">
          <p></p>
        </template>
        <template v-else>
          <button>次へ</button>
        </template>
      </div>
      <template v-if="isComplete">
      <div class="displayWords__commonBtn">
        <button @click="onPlayAgain">もう一度チャレンジする</button>
      </div>
      </template>
      <template v-if="!isAuto && !isManual">
        <div class="displayWords__commonBtn">
          <button @click="onAutoPlay">自動で再生する</button>
          <button @click="onManualPlay">手動で再生する</button>
        </div>
      </template>
    `,
    methods: {
      onAutoPlay() {
        this.isAuto = true;
        this.isManual = false;
        this.randomNo = this.getRandomIndex();
        this.displayWords = this.allWords[this.random10WordsIndex[this.randomNo]][0];
        this.autoPlay();
      },
      autoPlay() {
        this.intervalTimerArray.push(setInterval((function() {
          ++this.countUp;
          if(this.countUp<this.autoSpeedArray[0]) {
            this.displayWords = (this.isInOrder) ? this.allWords[this.random10WordsIndex[this.randomNo]][0] : this.allWords[this.random10WordsIndex[this.randomNo]][1];
          }
          else if(this.countUp<this.autoSpeedArray[1]) {
            this.displayWords = (this.isInOrder) ? this.allWords[this.random10WordsIndex[this.randomNo]][1] : this.allWords[this.random10WordsIndex[this.randomNo]][0];
          }
          else if(this.countUp<this.autoSpeedArray[2]) {
            this.displayWords = (this.isInOrder) ? this.allWords[this.random10WordsIndex[this.randomNo]][2] : this.allWords[this.random10WordsIndex[this.randomNo]][3];
          }
          else if(this.countUp<this.autoSpeedArray[3]) {
            this.displayWords = (this.isInOrder) ? this.allWords[this.random10WordsIndex[this.randomNo]][3] : this.allWords[this.random10WordsIndex[this.randomNo]][2];
          }
          else {
            this.randomNo = this.getRandomIndex();
            this.countUp = 0;
          }

        }).bind(this), 1000));

      },
      onStop() {
        this.isStopped = !this.isStopped;
        this.stoppedLabel = (this.isStopped) ? '再開する' : '停止する';

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
        this.isRegularSpeed = !this.isRegularSpeed;
        this.autoSpeedArray = (this.isRegularSpeed) ? [ 3, 7, 11, 15 ] : [ 2, 4, 6, 8 ];
        this.speedNow = (this.isRegularSpeed) ? '少し遅め' : '少し速め';
        this.speedLabel = (!this.isRegularSpeed) ? '少し遅め' : '少し速め';
      },
      onReverse() {
        this.isInOrder = !this.isInOrder;
        this.orderNow = this.isInOrder ? '単語→意味' : '意味→単語';
        this.orderLabel = !this.isInOrder ? '単語→意味' : '意味→単語';
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
        this.alreadyMemorized10Words = [];
        this.getRandom10WordsIndex();
      },
      onManualPlay() {
        this.isManual = true;
        this.isAuto = false;

        // 正解したかどうかを判定する「単語の意味を頭に思い浮かべてください」→合っていましたか？
        // 10個出し終わったら、正誤表を出す
        // 正解したものは「覚えた」にセットして、ローカルストレージにもセットする
        // 間違っているものは再度挑戦
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

          for(let cnt=0,len=10-notYetMemorizedWords.length;cnt<len;++cnt) {
            notYetMemorizedWords.push(alreadyMemorizedWords[cnt]);
          }
          getRandom10Words = notYetMemorizedWords;
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
        allWords: this.getAllWords
      }
    },
    template: `<div>
      <h3>新規登録</h3>
      <dl class="form">
        <dt>単語<small class="required">※必須 {{ alert[0] }}</small></dt>
        <dd><input type="text" size="30" v-model="input[0]" /><br /><small>例）apple</small></dd>
        <dt>単語の意味<small class="required">※必須 {{ alert[1] }}</small></dt>
        <dd><input type="text" size="30" v-model="input[1]" /><br /><small>例）りんご</small></dd>
        <dt>例文<small class="required">※必須 {{ alert[2] }}</small></dt>
        <dd><textarea cols="50" rows="3" v-model="input[2]"></textarea><br><small>例）I like apples.</small></dd>
        <dt>例文の意味<small class="required">※必須 {{ alert[3] }}</small></dt>
        <dd><textarea cols="50" rows="3" v-model="input[3]"></textarea><br><small>例）私はりんごが好きです。</small></dd>
      </dl>
      <button @click="onRegister" :disabled="isDisabled">単語を登録する</button>
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
        this.input.push([0,'']);

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
        allWords: this.getAllWords
      }
    },
    template: `<div>
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
        <dd><textarea cols="50" rows="3" v-model="input[2]"></textarea><br><small>例）I like apples.</small></dd>
        <dt>例文の意味<small class="required">※必須 {{ alert[3] }}</small></dt>
        <dd><textarea cols="50" rows="3" v-model="input[3]"></textarea><br><small>例）私はりんごが好きです。</small></dd>
        <dt></dt>
        <dd>
          <label><input type="checkbox" v-model="hasAlreadyMemorized" @change="onChangeCheck" />この単語を覚えた</label>
          <template v-if="hasAlreadyMemorized">（{{ registerDate }}）</template>
        </dd>
      </dl>
      <button @click="onChange(editIndex)" :disabled="isDisabled">変更を保存する</button>
      <button @click="onUnchange()">変更せずに一覧に戻る</button><br />
      <button @click="onDelete(editIndex)">この単語を削除する</button>
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
  .mount('.v-container');
