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
    interval = setInterval(() => this.now = new Date(), 1000);
  },

  data: {
    now: new Date(),
    month_names: month_names,
    sex_types: sex_types,
    personality_types: personality_types,
    species_types: species_types,
    tab: null,

    villager_sex_filter: null,
    villager_personality_filter: null,
    villager_species_filter: null,

    villager_group_by_keys: ['personality', 'species'],
    villager_group_by: null,

    villager_search: '',

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
      { text: 'Description', filterable: false, value: 'description_list' },
      { text: 'Friendly With', filterable: false, value: 'friendly_with' },
      { text: 'Neutral With', filterable: false, value: 'neutral_with' },
      { text: 'Unfriendly With', filterable: false, value: 'unfriendly_with' },
      { text: 'Active Hours', filterable: false, value: 'active_hours' },
    ],

  },

  methods: {
    getVillagerData: function() {
      var vm = this;
      $.ajax({
        url: 'https://raw.githubusercontent.com/rebekahgkh/ac_nh_villagers/master/data/villagers.json',
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
        url: 'https://raw.githubusercontent.com/rebekahgkh/ac_nh_villagers/master/data/personalities.json',
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
      return data.filter(row => (!sex_filter || row.sex === sex_filter) && (!personality_filter || row.personality === personality_filter) && (!species_filter || row.species === species_filter));
    },

    filterVillagerData: function() {
      var vm = this;
      vm.complete_villager_data = vm.filterComplete(vm.villager_data, vm.villager_sex_filter, vm.villager_personality_filter, vm.villager_species_filter);
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

      vm.current_villager_data = vm.current_villager_data.concat([villager]);
    },

    addToWishList: function(villager) {
      var vm = this;
      if (vm.wish_list_villager_data.map(v => v.name).includes(villager.name)) {
        return;
      }

      vm.wish_list_villager_data = vm.wish_list_villager_data.concat([villager]);
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

    removeFromCurrent: function(villager) {
      var vm = this;
      vm.current_villager_data = vm.removeFromList(vm.current_villager_data, villager, 'name');
    },

    removeFromWishList: function(villager) {
      var vm = this;
      vm.wish_list_villager_data = vm.removeFromList(vm.wish_list_villager_data, villager, 'name');
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
      var d = new Date(value)
      var month = new Intl.DateTimeFormat('en', { month: 'short' }).format(d)
      var day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(d)

      return `${month} ${day}`;
    },

  },
});
