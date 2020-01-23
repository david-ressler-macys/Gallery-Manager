<template>
  <div v-if="isQuickViewOpen" class="quick-view fixed flex-center text-center">
    <div v-on-clickaway="toggleQuickView" class="box">
      <div class="img-data">
        <div class="img-container flex-center">
          <v-lazy-image :src="selected.url" @load="onLoad" ref="img" />
          <span class="img-loader absolute"></span>
        </div>
        <div class="img-metadata">
          <div class="tag disabled">
            <b>name:</b>
            <span>{{selected.name}}</span>
          </div>
          <div class="tag disabled">
            <b>path:</b>
            <span>{{selected.url}}</span>
          </div>
          <div v-if="selected.size" class="tag disabled">
            <b>size:</b>
            <span>{{selected.size | kb }} KB</span>
          </div>
          <div v-if="selected.mtime" class="tag disabled">
            <b>last modified:</b>
            <span>{{selected.mtime | date}}</span>
          </div>
          <div
            class="tag"
            :class="{'disabled': !tag.isEditable}"
            v-for="tag in filteredTags"
            :key="tag.key"
          >
            <b>{{tag.label}}:</b>
            <span>
              <i v-if="!tag.edit">
                <template v-if="tag.filter === 'date'">{{tag.value | date}}</template>
                <template v-else-if="tag.filter === 'px'">{{tag.value | px}}</template>
                <template v-else>{{tag.value}}</template>
              </i>
              <input
                :ref="tag.key"
                v-if="tag.isEditable && tag.edit"
                v-model="tag.value"
                v-on:keyup="onPress(tag, $event)"
              />
              <button v-if="tag.isEditable && !tag.edit" class="edit" @click.prevent="edit(tag)"></button>
            </span>
          </div>
        </div>
      </div>
      <button @click="close">close</button>
      <button v-if="isSavedDrive" @click="remove">remove</button>
      <button v-if="!isSavedDrive" @click="select">select</button>
    </div>
  </div>
</template>

<script>
import { mapActions, mapMutations } from "vuex";
import { directive as onClickaway } from 'vue-clickaway';
import { metadataMixin } from "~/mixins/metadataMixin";
import { getExifTags } from '../utils/metadata.util';

export default {
  data() {
    return {
      filteredTags: [],
      isQuickViewOpen: true
    };
  },
  props: ["selected", "isSavedDrive"],
  directives: {
    onClickaway,
  },
  mixins: [metadataMixin],
  computed: {
    hasTags() {
      return Object.keys(this.filteredTags).length;
    }
  },
  methods: {
    ...mapActions(["removeFromSaved"]),
    ...mapMutations({
      selectItem: "selected/select"
    }),
    toggleQuickView() {
      this.isQuickViewOpen = !this.isQuickViewOpen;
    },
    async onLoad() {
      const imageSrc = this.$refs.img.$el.src;
      
      this.selected.tagsToChange = [];
      this.filteredTags = await getExifTags(imageSrc);
    },
    close() {
      this.$emit("close");
    },
    select() {
      this.selectItem(this.selected);
      this.close();
    },
    remove() {
      this.removeFromSaved(this.selected);
      this.close();
    },
    edit(tag) {
      tag.edit = true;
      this.selected.tagsToChange.push(tag);
      this.$nextTick(() => {
        this.$refs[tag.key][0].focus();
      });

      // setTimeout(() => {
      //   debugger;
      // }, 1000);
    },
    onPress(tag, event) {
      if (event.keyCode === 13 || event.keyCode === 27) {
        tag.edit = false;
      }
    }
  }
};
</script>

<style lang="scss">
@import "~/assets/css/vars";
@import "~/assets/css/mixins";

.quick-view {
  @include blackOpacity(background-color, 0.5);
  z-index: 3;

  .img-data {
    display: flex;
    margin-bottom: 10px;
  }

  .img-container {
    position: relative;
    flex: 1;
    min-height: 100px;
    min-width: 100px;
  }

  .img-metadata {
    flex: 0 0 350px;
    max-height: $box-height;
    min-width: 350px;
    margin-left: 10px;
    padding: 10px;
    background-color: #eff0f1;
    border-radius: 5px;
    overflow-y: auto;
    text-align: left;

    pre {
      font-size: 13px;
    }
  }

  img {
    min-height: 100px;
    max-height: 100px;
    opacity: 0;
    transition: 0.25s;
  }

  .v-lazy-image-loaded {
    max-height: $box-height;
    opacity: 1;
  }

  .v-lazy-image-loaded + .img-loader {
    display: none;
  }
}

.img-loader {
  display: block;
  background: $white url("~assets/icons/preloader.gif") no-repeat center;
  background-size: 45px;
  z-index: 2;
}

.box {
  margin: 2rem;
  padding: 20px;
  max-width: 90%;
  max-height: 100%;
  background-color: $white;
}

.close {
  position: absolute;
  top: 40px;
  right: 40px;
  font-size: 40px;
  font-weight: bold;
  z-index: 2;
  cursor: pointer;
}

.tag {
  display: flex;
  margin-bottom: 5px;
  font-size: 14px;
  line-height: 18px;

  input {
    width: 100%;
  }

  i {
    font-style: normal;
  }

  &.disabled {
    color: $dark-grey;
  }

  span {
    position: relative;
    display: flex;
    flex: 1;
    margin-left: 5px;
  }

  .edit {
    height: 18px;
    width: 18px;
    margin-left: 5px;
    background: $black;
    background-image: url("~assets/icons/edit.svg");
    background-repeat: no-repeat;
    background-size: 60%;
    background-position: center;
    border: none;
  }
}
</style>