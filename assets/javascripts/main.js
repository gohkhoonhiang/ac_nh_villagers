var month_names = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

var sex_types = [
  "male",
  "female"
];

var personality_types = [
  "Cranky",
  "Peppy",
  "Sisterly",
  "Lazy",
  "Normal",
  "Snooty",
  "Jock",
  "Smug"
];

var species_types = [
  "Alligator", "Anteater",
  "Bear", "Bird", "Bull",
  "Cat", "Chicken", "Cow", "Cub",
  "Deer", "Dog", "Duck",
  "Eagle", "Elephant",
  "Frog",
  "Goat", "Gorilla",
  "Hamster", "Hippo", "Horse",
  "Kangaroo", "Koala",
  "Lion",
  "Monkey", "Mouse",
  "Octopus", "Ostrich",
  "Penguin", "Pig",
  "Rabbit", "Rhino",
  "Sheep", "Squirrel",
  "Tiger",
  "Wolf"
];

var convertActiveHours = function(hours) {
  var start_hour = hours[0];
  var end_hour = hours[hours["length"]-1];

  return `${convertHourString(start_hour)} - ${convertHourString(end_hour)}`;
};

var convertHourString = function(hour) {
  if (hour > 12) {
    return `${hour - 12} PM`;
  } else if (hour < 12) {
    return `${hour} AM`;
  } else {
    return `${hour} NN`;
  }
};

var generateDate = function(time_value) {
  var today = new Date();
  var year = today.getFullYear();
  var month = today.getMonth();
  var day = today.getDate();
  var parts = time_value.split(':');
  var hour = parts[0];
  var minute = parts[1];
  return new Date(year, month, day, hour, minute, 0);
};

var monthAndDay = function(value) {
  if (!value) { return ''; }

  var d = new Date(value)
  var month = new Intl.DateTimeFormat('en', { month: 'short' }).format(d)
  var day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(d)

  return `${month} ${day}`;
};

var sortList = function(list, sort_key) {
  return list.sort(function(a, b) {
    if (a[sort_key] < b[sort_key]) {
      return -1;
    } else if (a[sort_key] > b[sort_key]) {
      return 1;
    } else {
      return 0;
    }
  });
};

var findMaxAttributesInObject = function(obj, attribute) {
  var sorted_keys = Object.keys(obj).sort(function(a, b) {
    if (obj[a][attribute] > obj[b][attribute]) {
      return -1;
    } else if (obj[a][attribute] < obj[b][attribute]) {
      return 1;
    } else {
      return 0;
    }
  });
  var max_key = sorted_keys[0];
  var max_value = obj[max_key][attribute];

  var max_keys = sorted_keys.filter(k => obj[k][attribute] === max_value);
  var max_values = {};
  max_keys.forEach(function(k) {
    max_values[k] = obj[k];
  });

  return max_values;
};

var findMinAttributesInObject = function(obj, attribute) {
  var sorted_keys = Object.keys(obj).sort(function(a, b) {
    if (obj[a][attribute] < obj[b][attribute]) {
      return -1;
    } else if (obj[a][attribute] > obj[b][attribute]) {
      return 1;
    } else {
      return 0;
    }
  });
  var min_key = sorted_keys[0];
  var min_value = obj[min_key][attribute];

  var min_keys = sorted_keys.filter(k => obj[k][attribute] === min_value);
  var min_values = {};
  min_keys.forEach(function(k) {
    min_values[k] = obj[k];
  });

  return min_values;
};

var filterList = function(data, filter_options) {
  return data.filter(function(row) {
    return filter_options.reduce(function(condition, filter_option) {
      var filter_key = filter_option.key;
      var filter_val = filter_option.val;
      var filter_type = filter_option.type;
      if (filter_type === 'multiple') {
        condition = condition && (!filter_val || filter_val.length === 0 || filter_val.includes(row[filter_key]));
      } else {
        condition = condition && (!filter_val || row[filter_key] === filter_val);
      }
      return condition;
    }, true);
  });
};

var app = new Vue({
  el: '#app',
  vuetify: new Vuetify({
    theme: {
      themes: {
        light: {
          primary: '#0ab5cd',
          secondary: '#fffae5',
          header: '#686868',
          toolbar: '#f5f8fe',
          font: '#837865',
          error: '#e76e60',
        },
      },
    },
  }),

  created() {
    this.retrieveSettings();
    this.getVillagerData();
    this.getPersonalityData();
    this.updateCurrentFriendships();
    interval = setInterval(() => this.now = new Date(), 1000);
  },

  data: {
    now: new Date(),
    month_names: month_names,
    sex_types: sex_types,
    personality_types: personality_types,
    species_types: species_types,
    tab: null,

    upcoming_birthday: {},

    villager_sex_filter: null,
    villager_personality_filter: [],
    villager_species_filter: [],

    villager_group_by_keys: ['personality', 'species'],
    villager_group_by: null,

    villager_search: '',
    current_villager_dialog: false,
    current_villager: {},
    current_friendships: {},
    friendship_leaderboard: {},

    current_personality_dialog: false,
    current_personality: {},

    confirm_remove_current_dialog: false,
    current_to_remove: {},
    confirm_remove_wish_list_dialog: false,
    wish_list_to_remove: {},

    villager_data: [],
    current_villager_data: [],
    wish_list_villager_data: [],
    complete_villager_data: [],
    villager_headers: [
      {
        text: 'Name',
        align: 'start',
        sortable: true,
        filterable: true,
        value: 'name',
      },
      { text: 'Sex', filterable: true, value: 'sex' },
      { text: 'Personality', filterable: false, value: 'personality' },
      { text: 'Species', filterable: false, value: 'species' },
      { text: 'Birthday', filterable: false, value: 'birthday' },
      { text: 'Catchphrase', filterable: false, value: 'catchphrase' },
      { text: 'Active Hours', filterable: false, value: 'active_hours' },
      { text: 'Actions', filterable: false, value: 'actions' },
    ],

    personality_data: [],
    complete_personality_data: [],
    personality_headers: [
      {
        text: 'Personality',
        align: 'start',
        sortable: true,
        filterable: true,
        value: 'personality',
      },
      { text: 'Friendly With', filterable: false, value: 'friendly_with' },
      { text: 'Neutral With', filterable: false, value: 'neutral_with' },
      { text: 'Unfriendly With', filterable: false, value: 'unfriendly_with' },
      { text: 'Active Hours', filterable: false, value: 'active_hours' },
      { text: 'Actions', filterable: false, value: 'actions' },
    ],

  },

  methods: {
    getVillagerData: function() {
      var vm = this;
      $.ajax({
        url: 'https://raw.githubusercontent.com/gohkhoonhiang/ac_nh_villagers/master/data/villagers.json',
        method: 'GET'
      }).then(function (data) {
        var villager_data = JSON.parse(data).data;
        var formatted_data = villager_data.map(function(row) {
          var updated_row = row;
          return updated_row;
        });

        vm.villager_data = formatted_data;
      });
    },

    getPersonalityData: function() {
      var vm = this;
      $.ajax({
        url: 'https://raw.githubusercontent.com/gohkhoonhiang/ac_nh_villagers/master/data/personalities.json',
        method: 'GET'
      }).then(function (data) {
        var personality_data = JSON.parse(data).data;
        var formatted_data = personality_data.map(function(row) {
          var updated_row = row;
          updated_row.description_list = row.description.split(',');
          return updated_row;
        });

        vm.personality_data = formatted_data;
      });
    },

    filterComplete: function(data, sex_filter, personality_filter, species_filter) {
      var vm = this;
      var filters = [
        { key: 'sex', val: sex_filter, type: 'single' },
        { key: 'personality', val: personality_filter, type: 'multiple' },
        { key: 'species', val: species_filter, type: 'multiple' },
      ];
      return filterList(data, filters);
    },

    filterVillagerData: function() {
      var vm = this;
      vm.complete_villager_data = vm.filterComplete(vm.villager_data, vm.villager_sex_filter, vm.villager_personality_filter, vm.villager_species_filter);
    },

    updateUpcomingBirthday: function() {
      var vm = this;
      if (vm.current_villager_data.length === 0) {
        vm.upcoming_birthday = {};
      } else {
        var today = new Date();
        var upcoming_list = vm.current_villager_data.filter(v => (new Date(v.birthday) >= today));
        var sorted = upcoming_list.sort(function(a, b) {
          var a_date = new Date(a.birthday);
          var b_date = new Date(b.birthday);
          if (a_date < b_date) {
            return -1;
          } else if (b_date < a_date) {
            return 1;
          } else {
            return 0;
          }
        });
        if (sorted.length > 0) {
          var upcoming = sorted[0];
          vm.upcoming_birthday = { name: upcoming.name, birthday: upcoming.birthday };
        } else {
          vm.upcoming_birthday = {};
        }
      }
    },

    notInList: function(list, villager) {
      var vm = this;
      return !list.map(v => v.name).includes(villager.name);
    },

    addToCurrent: function(villager) {
      var vm = this;
      if (vm.current_villager_data.map(v => v.name).includes(villager.name)) {
        return;
      }

      vm.current_villager_data = sortList(vm.current_villager_data.concat([villager]), 'name');
      vm.updateCurrentFriendships();
    },

    addToWishList: function(villager) {
      var vm = this;
      if (vm.wish_list_villager_data.map(v => v.name).includes(villager.name)) {
        return;
      }

      vm.wish_list_villager_data = sortList(vm.wish_list_villager_data.concat([villager]), 'name');
    },

    removeFromList: function(list, item, search_key) {
      var key_list = list.map(v => v[search_key]);
      if (key_list.includes(item[search_key])) {
        var i = key_list.indexOf(item[search_key]);
        list.splice(i, 1);
        return list;
      }

      return list;
    },

    promptRemoveFromCurrent: function(villager) {
      var vm = this;
      vm.current_to_remove = villager;
      vm.confirm_remove_current_dialog = true;
    },

    confirmRemoveFromCurrent: function() {
      var vm = this;
      vm.confirm_remove_current_dialog = false;

      if (!vm.current_to_remove) { return; }

      var villager = vm.current_to_remove;
      vm.current_villager_data = vm.removeFromList(vm.current_villager_data, villager, 'name');
      vm.updateCurrentFriendships();
    },

    cancelRemoveFromCurrent: function() {
      var vm = this;
      vm.current_to_remove = {};
      vm.confirm_remove_current_dialog = false;
    },

    promptRemoveFromWishList: function(villager) {
      var vm = this;
      vm.wish_list_to_remove = villager;
      vm.confirm_remove_wish_list_dialog = true;
    },

    confirmRemoveFromWishList: function() {
      var vm = this;
      vm.confirm_remove_wish_list_dialog = false;

      if (!vm.wish_list_to_remove) { return; }

      var villager = vm.wish_list_to_remove;
      vm.wish_list_villager_data = vm.removeFromList(vm.wish_list_villager_data, villager, 'name');
      vm.updateWishListFriendships();
    },

    cancelRemoveFromWishList: function() {
      var vm = this;
      vm.wish_list_to_remove = {};
      vm.confirm_remove_wish_list_dialog = false;
    },

    updateCurrentFriendships: function() {
      var vm = this;
      if (vm.current_villager_data.length === 0) {
        vm.current_friendships = {};
        return;
      }

      var current_friendships = {};
      var current_villagers = vm.current_villager_data;
      var current_villager_names = current_villagers.map(v => v.name);

      var friendly_list = current_villagers.flatMap(v => v.friendly_with);
      var unfriendly_list = current_villagers.flatMap(v => v.unfriendly_with);

      current_villagers.forEach(function(current_villager) {
        var current_friendly = current_villager.friendly_with;
        var current_neutral = current_villager.neutral_with;
        var current_unfriendly = current_villager.unfriendly_with;

        current_friendships[current_villager.name] = {
          friendly_with: current_villager_names.filter(other => current_friendly.includes(other)),
          neutral_with: current_villager_names.filter(other => current_neutral.includes(other)),
          unfriendly_with: current_villager_names.filter(other => current_unfriendly.includes(other)),
        };
      });

      vm.current_friendships = current_friendships;
      vm.updateFriendshipLeaderboard();
    },

    updateFriendshipLeaderboard: function() {
      var vm = this;
      var friendship_leaderboard = {};

      if (Object.keys(vm.current_friendships).length === 0) {
        vm.friendship_leaderboard = {};
        return;
      }

      var current_villagers = vm.current_villager_data;

      var friendly_list = current_villagers.flatMap(v => v.friendly_with);
      var unfriendly_list = current_villagers.flatMap(v => v.unfriendly_with);
      var current_friendships = vm.current_friendships;

      Object.keys(current_friendships).forEach(function(name) {
        var friendships = current_friendships[name];
        var friendly_with_count = friendships.friendly_with.length;
        var neutral_with_count = friendships.neutral_with.length;
        var unfriendly_with_count = friendships.unfriendly_with.length;
        var friended_count = friendly_list.filter(n => n === name).length;
        var unfriended_count = friendly_list.filter(n => n === name).length;

        friendship_leaderboard[name] = {
          friendly_with_count: friendly_with_count,
          neutral_with_count: neutral_with_count,
          unfriendly_with_count: unfriendly_with_count,
          friended_count: friended_count,
          unfriended_count: unfriended_count,
        };
      });

      var most_popular = findMaxAttributesInObject(friendship_leaderboard, 'friended_count');
      var most_unpopular = findMinAttributesInObject(friendship_leaderboard, 'friended_count');
      var most_friendly = findMaxAttributesInObject(friendship_leaderboard, 'friendly_with_count');
      var most_unfriendly = findMaxAttributesInObject(friendship_leaderboard, 'unfriendly_with_count');

      vm.friendship_leaderboard = {
        most_popular: most_popular,
        most_unpopular: most_unpopular,
        most_friendly: most_friendly,
        most_unfriendly: most_unfriendly,
      };
    },

    viewVillagerDetails: function(villager) {
      var vm = this;
      if (!villager) { return; }

      var current_villager = villager;
      vm.current_villager = current_villager;
      vm.current_villager_dialog = true;
    },

    viewPersonalityDetails: function(personality) {
      var vm = this;
      if (!personality) { return; }

      var current_personality = personality;
      vm.current_personality = current_personality;
      vm.current_personality_dialog = true;
    },

    clearAllVillagerFilters: function() {
      var vm = this;
      vm.villager_search = '';
      vm.villager_sex_filter = null;
      vm.villager_personality_filter = [];
      vm.villager_species_filter = [];
    },

    retrieveSettings: function() {
      var vm = this;
      var settings = JSON.parse(localStorage.getItem('ac_nh_villagers_settings'));
      if (!settings) { return; }

      for (var property in settings) {
        vm[property] = settings[property];
      }
    },

    storeSettings: function() {
      var vm = this;
      var settings = {
        villager_sex_filter: vm.villager_sex_filter,
        villager_personality_filter: vm.villager_personality_filter,
        villager_species_filter: vm.villager_species_filter,
        villager_group_by: vm.villager_group_by,
        current_villager_data: vm.current_villager_data,
        wish_list_villager_data: vm.wish_list_villager_data,
      };

      localStorage.setItem('ac_nh_villagers_settings', JSON.stringify(settings));
    },

    resetSettings: function() {
      localStorage.removeItem('ac_nh_villagers_settings');
    },

  },

  watch: {
    villager_data: function(new_val, old_val) {
      var vm = this;
      if (new_val.length > 0) {
        vm.filterVillagerData();
      }
    },

    current_villager_data: function(new_val, old_val) {
      var vm = this;
      vm.updateUpcomingBirthday();
      vm.storeSettings();
    },

    wish_list_villager_data: function(new_val, old_val) {
      var vm = this;
      vm.storeSettings();
    },

    villager_sex_filter: function(new_val, old_val) {
      var vm = this;
      vm.filterVillagerData();
      vm.storeSettings();
    },

    villager_personality_filter: function(new_val, old_val) {
      var vm = this;
      vm.filterVillagerData();
      vm.storeSettings();
    },

    villager_species_filter: function(new_val, old_val) {
      var vm = this;
      vm.filterVillagerData();
      vm.storeSettings();
    },

    villager_group_by: function(new_val, old_val) {
      var vm = this;
      vm.storeSettings();
    },

  },

  filters: {
    time_normalized: function(value) {
      if (!value) {
        return '';
      }

      var h = value.getHours();
      var m = value.getMinutes();
      var s = value.getSeconds();
      var parts = [h, m, s];

      var normalized_parts = parts.map(function(part) {
        var i = parseInt(part);
        if (i < 10) {
          return `0${i}`;
        } else {
          return `${i}`;
        }
      });

      return normalized_parts.join(':');
    },

    month_name: function(value) {
      if (!value) {
        return '';
      }

      var month = value.getMonth();
      return month_names[month];
    },

    hours_range: function(value) {
      if (!value) {
        return '';
      }

      return convertActiveHours(value);
    },

    month_and_day: function(value) {
      return monthAndDay(value);
    },

    birthday_boy_girl: function(value) {
      if (!value || $.isEmptyObject(value)) { return 'No data'; }

      return `${value.name} on ${monthAndDay(value.birthday)}`;
    },

  },
});
