import { uniq } from "underscore";

export const state = () => ({
  items: [],
  prevItems: [],
  limit: 0,
  step: 0,
})

export const actions = {
  async loadItems({ commit, state }, { drive, isSavedDrive }) {
    if (isSavedDrive) {
      commit('save');
    }

    let items = [];

    const t0 = performance.now();
    try {
      items = await this.$axios.$get(`/api/load?drive=${drive}`);
    } catch (e) {
      return e && e.response && e.response.data
        ? this.$toast.error(e.response.data)
        : this.$toast.error('Server Error');
    }
    const t1 = performance.now();
    console.log(`load items took: ${t1 - t0} milliseconds`);

    if (!items.length) {
      return this.$toast.info("no items to add");
    };
    if (state.items.length) {
      commit('changeInterval');
    }
    commit('add', items);
  },
  async removeFromSaved({ state, commit }, { url, name }) {
    try {
      await this.$axios.$post("/api/remove", { url });
    } catch (e) {
      return this.$toast.error("Server Error");
    }

    commit('remove', url);
    commit('selected/remove', name);
    this.$toast.success("Removed from the list");
  }
}

export const mutations = {
  add(state, items) {
    state.items = state.items.concat(items);
    setTimeout(() => this.$toast.success('Added to the gallery'), 400);
  },
  save(state) {
    state.prevItems = state.items;
    state.items = [];
  },
  drop(state) {
    state.items = [];
  },
  revert(state) {
    state.items = state.prevItems;
  },
  remove(state, url) {
    state.items = state.items.filter(item => item.url !== url);
  },
  changeInterval(state, payload) {
    if (payload) {
      const { limit, step } = payload;

      state.limit = limit;
      state.step = step;
    } else {
      state.limit = state.limit + state.step;
    }
  }
}

export const getters = {
  filteredItems(state) {
    return uniq(state.items, item => item.url);
  },
  count: (state, getters) => getters.filteredItems.length,
  limited(state, getters) {
    return getters.filteredItems.slice(0, state.limit);
  }
  // limited: (state, getters) => getters.filteredItems,
}
