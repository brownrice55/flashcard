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
        allWords : JSON.parse(localStorage.getItem('allWords')) || []
      };
    },
    provide() {
      return {
        allWords : this.allWords
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
      }
    },
    mounted() {
      if(this.allWords.length<10) {
        this.current = 'register';
        //***　後で対応　この場合は「単語を覚える」のナビも表示させない
      }
    }
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
    inject: [ 'allWords' ],
    data() {
      return {
        isAuto: false,
        isManual: false,
        isInOrder: true,//表示順
        isStopped: false,
        random10Words: [],
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
        isComplete: false
      }
    },
    mounted() {
      let notYetMemorizedWords = [];
      let alreadyMemorizedWords = [];
      let randomIndex;
      let arrayCnt = 0;
      let cnt = 0;
      for(let cnt=0,len=this.allWords.length;cnt<len;++cnt){
        // 最初に覚えたものと覚えていないものを分けた後に、ランダムで最大10個抜き出す
        if(this.allWords[cnt][4]) {
          alreadyMemorizedWords.push(this.allWords[cnt].concat([cnt]));
        }
        else {
          notYetMemorizedWords.push(this.allWords[cnt].concat([cnt]));
        }
      }

      if(notYetMemorizedWords.length<10) {//まだ覚えていない単語が10個より少ない時
        // 覚えた単語の日付の古いものから取得する
        alreadyMemorizedWords.sort(
          function(a,b){
            return (a < b ? -1 : 1);
          }
        );

        for(let cnt=0,len=10-notYetMemorizedWords.length;cnt<len;++cnt) {
          notYetMemorizedWords.push(alreadyMemorizedWords[cnt]);
        }
      }

      for(let cnt=0,len=notYetMemorizedWords.length;cnt<10;++cnt,--len) {
        randomIndex = Math.floor( Math.random() * this.allWords);
        this.random10Words.push(notYetMemorizedWords.splice(randomIndex,1)[0]);
      }

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
      <div class="displayWords__commonBtn">
        <button @click="onAutoPlay" :disabled="isAuto">自動で再生する</button>
        <button @click="onManualPlay" :disabled="isManual">手動で再生する</button>
      </div>
    `,
    methods: {
      onAutoPlay() {
        this.isAuto = true;
        this.isManual = false;
        this.randomNo = this.getRandomIndex();
        this.displayWords = this.random10Words[this.randomNo][0];
        this.autoPlay();
      },
      autoPlay() {
        this.intervalTimerArray.push(setInterval((function() {

          ++this.countUp;
          if(this.countUp<this.autoSpeedArray[0]) {
            this.displayWords = (this.isInOrder) ? this.random10Words[this.randomNo][0] : this.random10Words[this.randomNo][1];
          }
          else if(this.countUp<this.autoSpeedArray[1]) {
            this.displayWords = (this.isInOrder) ? this.random10Words[this.randomNo][1] : this.random10Words[this.randomNo][0];
          }
          else if(this.countUp<this.autoSpeedArray[2]) {
            this.displayWords = (this.isInOrder) ? this.random10Words[this.randomNo][2] : this.random10Words[this.randomNo][3];
          }
          else if(this.countUp<this.autoSpeedArray[3]) {
            this.displayWords = (this.isInOrder) ? this.random10Words[this.randomNo][3] : this.random10Words[this.randomNo][2];
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
        return parseInt(Math.random() * this.random10Words.length);
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
        // 覚えた単語のインデックス値を特定
        let alreadyMemorizedWordIndex = this.random10Words[this.randomNo][5];

        // allwordsの該当する単語の[4]に現在時刻を入れる
        this.allWords[alreadyMemorizedWordIndex][4] = this.getNow();

        // ローカルストレージにも反映する
        localStorage.setItem('allWords', JSON.stringify(this.allWords));

        // 該当する単語をalreadyMemorized10Wordsにプッシュして10wordsから削除する
        this.alreadyMemorized10Words.push(this.random10Words[this.randomNo]);
        this.random10Words.splice(this.randomNo, 1);

        if(!this.random10Words.length) {
          // 10wordsが空になった場合は、「下記の単語を全て覚えました」と、alreadyMemorized10Wordsを表示する
          this.isComplete = true;
        }
        else {
          // 残った単語で自動再生を始める
          this.countUp = 0;
          this.onAutoPlay();
        }
      },
      onManualPlay() {
        //自動で動いている場合はクリアしておく
        if(this.isAuto && this.intervalTimerArray.length>0) {
          clearInterval(this.intervalTimerArray.shift());
        }

        this.isAuto = false;

        // 正解したかどうかを判定する「単語の意味を頭に思い浮かべてください」→合っていましたか？
        // 10個出し終わったら、正誤表を出す
        // 正解したものは「覚えた」にセットして、ローカルストレージにもセットする
        // 間違っているものは再度挑戦
      },
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
    inject: [ 'allWords' ],
    data() {
      return {
        input: ['','','',''],
        alert: ['','','',''],
        isDisabled: true,
        isAdded: false
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
        this.input.push('');

        this.allWords.push(this.input);
        localStorage.setItem('allWords', JSON.stringify(this.allWords));

        this.input = ['','','',''];
        this.isAdded = true;
      }
    },
    mixins: [ formAlerts ]
  })
  .component('register-list',{
    inject: [ 'allWords' ],
    emits: [ 'judgeIsNotEdit' ],
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
    data() {
      return {
        input : [
          this.allWords[this.editIndex][0],
          this.allWords[this.editIndex][1],
          this.allWords[this.editIndex][2],
          this.allWords[this.editIndex][3]
        ],
        hasAlreadyMemorized: this.allWords[this.editIndex][4] ? true : false,
        registerDate: this.allWords[this.editIndex][4] ? this.allWords[this.editIndex][4] : '',
        isDisabled: true,
        alert: [ '','','','' ],
        isAuto: this.isAuto
      }
    },
    inject: [ 'allWords' ],
    props: [ 'editIndex' ],
    emits: [ 'judgeIsNotEdit' ],
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
          <label><input type="checkbox" v-model="hasAlreadyMemorized" />この単語を覚えた</label>
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
      },
      hasAlreadyMemorized() {
        this.registerDate = (this.hasAlreadyMemorized) ? this.getNow() : this.allWords[this.editIndex][4];
        this.judgeDisabled();
      }
    },
    methods: {
      onChange(aEditIndex) {
        let inputRegisterData = (this.hasAlreadyMemorized) ? this.registerDate : '';
        let inputData = this.input.concat([inputRegisterData]);
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
        let changedArray = this.input.concat([this.registerDate]);
        let isChanged = (changedArray.toString()!==this.allWords[this.editIndex].toString()) ? true : false;
        this.isDisabled = (isChanged || Boolean(this.allWords[this.editIndex][4])!==this.hasAlreadyMemorized) ? false : true;
      }
    },
    mixins: [ formAlerts, getNowData ]
  })
  .mount('.v-container');
