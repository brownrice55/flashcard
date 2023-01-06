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
      onclick(aKey) {
        this.current = aKey;
      }
    },
    computed: {
      currentPage() {
        return `page-${this.current}`;
      }
    }
  })
  .component('page-memorize', {
    data() {
      return {
        name: '',
      }
    },
    template: `<div>
    <h2>単語を覚える</h2>
    <p>単語を１０個覚えましょう。覚えたら「覚えた」ボタンを押してね。</p>
    <memorize-vocabulary></memorize-vocabulary>
    </div>`
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
    data() {
      return {
        register1: '',
        register2: '',
        register3: '',
        register4: '',
        alert1: '',
        alert2: '',
        alert3: '',
        alert4: '',
      }
    },
    template: `<div>
      <h3>新規登録</h3>
      <dl class="form">
        <dt>単語<small class="required">※必須 {{ alert1 }}</small></dt>
        <dd><input type="text" size="30" v-model="register1" /><br /><small>例）apple</small></dd>
        <dt>単語の意味<small class="required">※必須 {{ alert2 }}</small></dt>
        <dd><input type="text" size="30" v-model="register2" /><br /><small>例）りんご</small></dd>
        <dt>例文<small class="required">※必須 {{ alert3 }}</small></dt>
        <dd><textarea cols="50" rows="3" v-model="register3"></textarea><br><small>例）I like apples.</small></dd>
        <dt>例文の意味<small class="required">※必須 {{ alert4 }}</small></dt>
        <dd><textarea cols="50" rows="3" v-model="register4"></textarea><br><small>例）私はりんごが好きです。</small></dd>
      </dl>
      <button @click="onRegister">新規登録</button>
    </div>`,
    watch: {
      register1() {

      }
    },
    methods: {
      onRegister() {
        this.alert1 = (!this.register1) ? '入力してください' : '';
        this.alert2 = (!this.register2) ? '入力してください' : '';
        this.alert3 = (!this.register3) ? '入力してください' : '';
        this.alert4 = (!this.register4) ? '入力してください' : '';
      }
    }

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
        register1 : this.allWords[this.editIndex][0],
        register2 : this.allWords[this.editIndex][1],
        register3 : this.allWords[this.editIndex][2],
        register4 : this.allWords[this.editIndex][3],
        register5 : this.allWords[this.editIndex][4] ? true : false,
        registerDate : this.allWords[this.editIndex][4] ? this.allWords[this.editIndex][4] : '',
      }
    },
    inject: [ 'allWords' ],
    props: [ 'editIndex' ],
    emits: [ 'judgeIsNotEdit' ],
    template: `<div>
      <h3>単語の編集</h3>
      <dl class="form">
        <dt>単語<small class="required">※必須 {{ alert1 }}</small></dt>
        <dd><input type="text" size="30" v-model="register1" /><br /><small>例）apple</small></dd>
        <dt>単語の意味<small class="required">※必須 {{ alert2 }}</small></dt>
        <dd><input type="text" size="30" v-model="register2" /><br /><small>例）りんご</small></dd>
        <dt>例文<small class="required">※必須 {{ alert3 }}</small></dt>
        <dd><textarea cols="50" rows="3" v-model="register3"></textarea><br><small>例）I like apples.</small></dd>
        <dt>例文の意味<small class="required">※必須 {{ alert4 }}</small></dt>
        <dd><textarea cols="50" rows="3" v-model="register4"></textarea><br><small>例）私はりんごが好きです。</small></dd>
        <dt></dt>
        <dd>
          <label><input type="checkbox" v-model="register5" />この単語を覚えた</label>
          <template v-if="register5">（{{ registerDate }}）</template>
        </dd>
      </dl>
      <button @click="onChange()">変更を保存する</button>
      <button @click="onUnchange()">変更せずに一覧に戻る</button>
      <button @click="onDelete()">この単語を削除する</button>
    </div>`,
    methods: {
      onChange(aIndex) {
        this.$emit('judgeIsNotEdit');
      },
      onUnchange() {
        this.$emit('judgeIsNotEdit');
      },
      onDelete() {
        this.$emit('judgeIsNotEdit');
      }
    }
  })
  .component('memorize-vocabulary', {
    template: `
      <div>
        <span>単語→意味</span>
        <div class="displayWords"><!-- 単語を表示 --></div>
        <div v-if="isNowPlaying">
          <template v-if="isAuto">
            <button>停止する</button>
          </template>
          <template v-else>
            <button>次へ</button>
          </template>
          <button>もう覚えた</button><br>
          <button>単語の意味と表示順を逆にする</button>
        </div>
        <div v-else>
          <button>自動で再生する</button>
          <button>手動で再生する</button>
        </div>
      </div>
    `,
    data() {
      return {
        isNowPlaying: false,
        isAuto: true
      }
    }
  })
  .mount('.v-container');
