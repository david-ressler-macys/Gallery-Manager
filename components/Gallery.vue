<template>
  <div class="gallery">
    <div class="gallery-nav">
      <div class="flex-center">
        <div class="hint" v-if="!count && !isLoading">Gallery is empty</div>
        <div class="hint" v-if="count && !isLoading">
          Count:
          <b>{{count}}</b>
        </div>
      </div>
      <div class="flex-center">
        <div v-if="isLoading" class="loading flex-center">
          <i class="loading"></i>
          <span>Loading...</span>
        </div>
        <div v-if="count" class="view-controls flex-center">
          <div
            class="icon-grid"
            @click="activateGridView"
            :class="{active: isGridView}"
            title="grid view"
          >
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div
            class="icon-list"
            @click="activateListView"
            :class="{active: isListView}"
            title="list view"
          >
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      <!-- <div class="align-right">
        <select v-if="items.length" v-model="size">
          <option v-for="item of sizes" :key="item">{{item}}</option>
        </select>
      </div>-->
    </div>

    <div
      class="gallery-grid"
      :class="{size, 'grid-disabled': !isGridView}"
      v-infinite-scroll="append"
      infinite-scroll-disabled="busy"
      infinite-scroll-immediate-check="true"
      infinite-scroll-distance="400"
      @mouseleave="hideActions"
    >
      <div v-if="isGridView" @mouseover="debounceActions">
        <masonry ref="masonry" :cols="columns" :gutter="{default: '5px'}">
          <GridItem
            v-for="(item, index) in limited"
            :key="index"
            :item="item"
            :isNativeLoading="isNativeLoading"
            :style="{ 'padding-bottom': (item.height / item.width * 100) + '%' }"
          />
        </masonry>
      </div>

      <HoverActions
        v-if="isGridView"
        :isSavedDrive="isSavedDrive"
        :data="picked"
        @pick="pick()"
        @select="select()"
        @remove="remove()"
      />
    </div>

    <div v-if="isListView" class="gallery-list" ref="list">
      <virtual-list :size="list.height" :remain="list.remain" :bench="list.bench">
        <ListItem
          v-for="item in items"
          :key="item.thumbUrl"
          :item="item"
          :isNativeLoading="isNativeLoading"
          :isSavedDrive="isSavedDrive"
          :minHeight="list.height"
          @pick="pick"
          @select="selectItem"
          @remove="removeFromSaved"
        />
      </virtual-list>
    </div>

    <QuickView v-if="isOpen" :selected="selected" :isSavedDrive="isSavedDrive" @close="close" />
  </div>
</template>

<script>
import QuickView from "~/components/QuickView.vue";
import ListItem from "~/components/ListItem.vue";
import GridItem from "~/components/GridItem.vue";
import HoverActions from "~/components/HoverActions.vue";
import { mapGetters, mapActions, mapMutations } from "vuex";
import { debounce } from "underscore";
import { grid, list, config } from "../config/gallery.config";

export default {
  components: {
    QuickView,
    ListItem,
    GridItem,
    HoverActions
  },
  data: () => {
    return {
      isOpen: false,
      isGridView: true,
      isListView: false,
      isNativeLoading:
        typeof window !== "undefined"
          ? "loading" in window.HTMLImageElement.prototype
          : false,
      selected: null,
      size: "small",
      picked: null,
      list
    };
  },
  props: ["items", "limited", "isSavedDrive", "isLoading"],
  computed: {
    ...mapGetters({
      count: "count"
    }),
    columns() {
      return this.isSavedDrive
        ? grid.extend[this.size].cols
        : grid.compact[this.size].cols;
    }
  },
  created() {
    this.debounceActions = debounce(this.showActions, config.hoverDebounce);
  },
  mounted() {
    if (this.isGridView) {
      this.resetGridView();
    }
    if (this.isListView) {
      this.resetListView();
    }
  },
  watch: {
    isSavedDrive: function() {
      if (this.isGridView) {
        this.resetGridView();
      }
    }
  },
  methods: {
    ...mapActions(["removeFromSaved"]),
    ...mapMutations({
      selectItem: "selected/select",
      changeInterval: "changeInterval"
    }),
    pick(item) {
      if (item) {
        this.selected = item;
      } else {
        this.selected = this.items.find(
          ({ thumbUrl }) => thumbUrl === this.picked.url
        );
      }
      this.isOpen = true;
    },
    select() {
      const item = this.items.find(
        ({ thumbUrl }) => thumbUrl === this.picked.url
      );
      this.selectItem(item);
    },
    remove() {
      const item = this.items.find(
        ({ thumbUrl }) => thumbUrl === this.picked.url
      );
      this.removeFromSaved(item);
    },
    close() {
      this.isOpen = false;
    },
    append() {
      this.busy = true;
      this.changeInterval();
      setTimeout(() => {
        this.busy = false;
      }, 150);
    },
    resetGridView() {
      const limit = this.isSavedDrive
        ? grid.extend[this.size].limit
        : grid.compact[this.size].limit;
      const step = this.isSavedDrive
        ? grid.extend[this.size].step
        : grid.compact[this.size].step;
      this.changeInterval({ limit, step });
    },
    resetListView() {
      if (this.$refs.list) {
        const height = this.$refs.list.offsetHeight;

        this.list.remain = Math.floor(height / this.list.initialHeight);
        this.list.height =
          this.list.initialHeight +
          Math.floor(
            (height - this.list.remain * this.list.initialHeight) /
              this.list.remain
          );
      }
    },
    showActions(e) {
      const $target = e.target;

      if (
        $target.tagName === "SPAN" ||
        $target.classList.contains("hover-actions")
      ) {
        return false;
      }

      if ($target.tagName === "IMG") {
        const url = $target.getAttribute("src");
        const { width, height } = $target;
        const { offsetTop, offsetLeft } = $target.parentNode;
        this.picked = {
          url,
          width,
          height,
          offsetTop,
          offsetLeft
        };
      } else {
        this.picked = null;
      }
    },
    hideActions() {
      this.picked = null;
      // clean up debounce drawback
      setTimeout(() => (this.picked = null), config.hoverDebounce);
    },
    activateGridView() {
      if (this.isGridView) return;

      this.resetGridView();
      this.isListView = false;
      this.isGridView = true;
    },
    activateListView() {
      if (this.isListView) return;

      this.isGridView = false;
      this.isListView = true;
      this.$nextTick(() => this.resetListView());
    }
  }
};
</script>

<style lang="scss">
@import "~/assets/css/vars";

.gallery {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 0 7px 12px;
  border-radius: 5px;
  box-shadow: 0 13px 20px -6px rgba(0, 0, 0, 0.1);

  &-list {
    flex: 1;
    overflow: hidden;

    & > div {
      padding-right: 12px;
    }
  }
}

.gallery-nav {
  flex: 0 0 46px;
  display: flex;
  padding-right: 12px;
  align-items: center;
  justify-content: space-between;
}

.gallery-grid {
  overflow-y: auto;
  flex: 1;
  padding-right: 12px;
  position: relative;

  & > div:first-child {
    height: 100%;
  }
}

.grid-disabled {
  flex: 0;
  visibility: hidden;
  & > div {
    height: auto;
  }
}

.view-controls {
  margin-left: 20px;

  div {
    height: 24px;
    border: 1px solid #dadada;
    background-color: #fff;
    cursor: pointer;
    position: relative;

    &:hover {
      span {
        background-color: #999;
      }
    }

    &.active {
      cursor: default;
      background-color: #fff;
      span {
        background-color: #000;
      }
    }

    span {
      display: block;
      position: absolute;
      width: 5px;
      height: 4px;
      background-color: #b7b7b7;
      transition: background-color ease 0.1s;
    }
  }
}

.icon-grid {
  width: 29px;
  z-index: 2;
  border-radius: 2px 0 0 2px;

  &.active + div {
    border-left: 1px solid #fff;
  }
  span:nth-child(1) {
    top: 2px;
    left: 3px;
  }

  span:nth-child(2) {
    top: 2px;
    left: 11px;
  }

  span:nth-child(3) {
    top: 2px;
    left: 19px;
  }
  span:nth-child(4) {
    top: 9px;
    left: 3px;
  }

  span:nth-child(5) {
    top: 9px;
    left: 11px;
  }

  span:nth-child(6) {
    top: 9px;
    left: 19px;
  }
  span:nth-child(7) {
    top: 16px;
    left: 3px;
  }

  span:nth-child(8) {
    top: 16px;
    left: 11px;
  }

  span:nth-child(9) {
    top: 16px;
    left: 19px;
  }
}

.icon-list {
  width: 28px;
  border-radius: 0 2px 2px 0;
  left: -1px;

  div + &.active {
    border-left: 1px solid #fff;
  }
  span:nth-child(1) {
    top: 2px;
    left: 3px;
  }
  span:nth-child(2) {
    top: 2px;
    left: 10px;
    width: 13px;
  }
  span:nth-child(3) {
    top: 9px;
    left: 3px;
  }
  span:nth-child(4) {
    top: 9px;
    left: 10px;
    width: 13px;
  }

  span:nth-child(5) {
    top: 16px;
    left: 3px;
  }
  span:nth-child(6) {
    top: 16px;
    left: 10px;
    width: 13px;
  }
}
</style>
