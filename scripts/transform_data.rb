require 'json'
require 'csv'
require 'date'

InvalidFileFormat = Class.new(StandardError)

# example
# Raw data:
# Name,Sex,Personality,Species,Birthday,Catchphrase
# Admiral,male,Cranky,Bird,January 27th,aye aye
# and
# Personality,Description,Friendly With,Neutral With,Unfriendly With,Sleep Time,Wake Up Time
# Cranky,"grumpy,most of the day out,self-centred,enjoy gossip about lifestyles of other villagers","Snooty,Jock,Cranky","Lazy,Normal","Peppy,Smug,Sisterly",5:00:00 AM,10:00:00 AM
#
# will be converted to:
# Formatted data: {"data":[{"name":"Admiral","sex":"male","personality":"Cranky","species":"Bird","birthday":"2020-01-27","catchphrase":"aye aye","friendly_with":["Alli",...],"neutral_with":[],"unfriendly_with":[],"sleep_time":"5:00:00 AM","wake_up_time":"10:00:00 AM","sleep_hour":5,"wake_up_hour":10,"active_hours":[5,6,7,8,9,10]}]}
def combined_list(villagers_list, personalities_list, output)
  formatted_villagers = format_villagers(villagers_list)
  formatted_personalities = format_personalities(personalities_list)

  combined = combine_villagers_personalities(formatted_villagers, formatted_personalities)

  File.write("#{output}/villagers.json", { data: combined.sort_by { |row| row["name"] } }.to_json)
  File.write("#{output}/personalities.json", { data: formatted_personalities.sort_by { |row| row["personality"] } }.to_json)
end

# example
# Raw data:
# Name,Sex,Personality,Species,Birthday,Catchphrase
# Admiral,male,Cranky,Bird,January 27th,aye aye
#
# will be converted to:
# Formatted data: {"name"=>"Admiral", "sex"=>"male", "personality"=>"Cranky", "species"=>"Bird", "birthday"=>"January 27th", "catchphrase"=>"aye aye"}
def format_villagers(file_path)
  raise InvalidFileFormat unless File.extname(file_path) == ".csv"

  content = CSV.read(file_path, col_sep: ",", headers: true)
  transformed = content.map do |row|
    row.to_h.transform_keys { |k| snake_case(k) }
  end

  format_villager_rows(transformed)
end

# example
# Raw data:
# Personality,Description,Friendly With,Neutral With,Unfriendly With,Sleep Time,Wake Up Time
# Cranky,"grumpy,most of the day out,self-centred,enjoy gossip about lifestyles of other villagers","Snooty,Jock,Cranky","Lazy,Normal","Peppy,Smug,Sisterly",5:00:00 AM,10:00:00 AM
#
# will be converted to:
# Formatted data: {"personality"=>"Cranky", "description"=>"grumpy,most of the day out,self-centred,enjoy gossip about lifestyles of other villagers", "friendly_with"=>"Snooty,Jock,Cranky", "neutral_with"=>"Lazy,Normal", "unfriendly_with"=>"Peppy,Smug,Sisterly", "sleep_time"=>"5:00:00 AM", "wake_up_time"=>"10:00:00 AM"}
def format_personalities(file_path)
  raise InvalidFileFormat unless File.extname(file_path) == ".csv"

  content = CSV.read(file_path, col_sep: ",", headers: true)
  transformed = content.map do |row|
    row.to_h.transform_keys { |k| snake_case(k) }
  end

  format_personality_rows(transformed)
end

def combine_villagers_personalities(villagers, personalities)
  villagers.inject([]) do |acc, villager|
    personality = personalities.find { |p| p["personality"] == villager["personality"] }
    friendly_with = find_villagers_with_personalities(villagers, villager["name"], personality["friendly_with"])
    neutral_with = find_villagers_with_personalities(villagers, villager["name"], personality["neutral_with"])
    unfriendly_with = find_villagers_with_personalities(villagers, villager["name"], personality["unfriendly_with"])
    active_hours = personality["active_hours"]
    acc << villager.merge("friendly_with" => friendly_with, "neutral_with" => neutral_with, "unfriendly_with" => unfriendly_with, "active_hours" => active_hours)
  end
end

def find_villagers_with_personalities(villagers, exclude_villager, personalities)
  villagers.inject([]) do |acc, villager|
    next acc unless !Array(exclude_villager).include?(villager["name"]) && personalities.include?(villager["personality"])
    acc << villager["name"]
  end
end

# example
# Raw data: {"name"=>"Admiral", "sex"=>"male", "personality"=>"Cranky", "species"=>"Bird", "birthday"=>"January 27th", "catchphrase"=>"aye aye"}
#
# will be converted to:
# Formatted data: {"name"=>"Admiral", "sex"=>"male", "personality"=>"Cranky", "species"=>"Bird", "birthday"=>"2020-01-27", "catchphrase"=>"aye aye"}
def format_villager_rows(rows)
  rows.each do |row|
    format_villager_row(row)
  end
  rows
end

def format_villager_row(row)
  row["name"] = if row["name"].match?(/.*NA/)
                  row["name"].gsub(/NA/," (NA)")
                elsif row["name"].match?(/.*PAL/)
                  row["name"].gsub(/PAL/," (PAL)")
                else
                  row["name"]
                end
  row["birthday"] = format_date(row["birthday"])

  row
end

# example
# Raw data: {"personality"=>"Cranky", "description"=>"grumpy,most of the day out,self-centred,enjoy gossip about lifestyles of other villagers", "friendly_with"=>"Snooty,Jock,Cranky", "neutral_with"=>"Lazy,Normal", "unfriendly_with"=>"Peppy,Smug,Sisterly", "sleep_time"=>"5:00:00 AM", "wake_up_time"=>"10:00:00 AM"}
#
# will be converted to:
# Formatted data: {"personality"=>"Cranky", "description"=>"grumpy,most of the day out,self-centred,enjoy gossip about lifestyles of other villagers", "friendly_with"=>["Snooty","Jock","Cranky"], "neutral_with"=>["Lazy","Normal"], "unfriendly_with"=>["Peppy","Smug","Sisterly"], "sleep_time"=>"5:00:00 AM", "wake_up_time"=>"10:00:00 AM", "sleep_hour"=>5, "wake_up_hour"=>10, "active_hours"=>[11,12,13,14,15,16,17,18,19,20,21,22,23,0,1,2,3,4]}
def format_personality_rows(rows)
  rows.each do |row|
    format_personality_row(row)
  end
  rows
end

def format_personality_row(row)
  row["sleep_hour"] = format_time(row["sleep_time"]).hour
  row["wake_up_hour"] = format_time(row["wake_up_time"]).hour
  row["active_hours"] = extract_hours(row["wake_up_hour"], row["sleep_hour"])
  row["friendly_with"] = row["friendly_with"].to_s.split(",")
  row["neutral_with"] = row["neutral_with"].to_s.split(",")
  row["unfriendly_with"] = row["unfriendly_with"].to_s.split(",")

  row
end

def snake_case(s)
  s.downcase.tr(' ','_')
end

def format_date(date_string)
  Date.strptime(date_string, '%B %d').strftime('%Y-%m-%d')
end

def format_time(time_string)
  DateTime.strptime(time_string, '%l:%M:%S %P')
end

def extract_hours(start_hour, end_hour)
  start_time, end_time = if start_hour > end_hour
    [Time.new(2020,1,1,start_hour,0,0,"+00:00"), Time.new(2020,1,2,end_hour,0,0,"+00:00")]
  else
    [Time.new(2020,1,1,start_hour,0,0,"+00:00"), Time.new(2020,1,1,end_hour,0,0,"+00:00")]
  end

  hours = [start_time.hour]
  interval = 3600
  stepped_start_time = start_time
  while (stepped_start_time = stepped_start_time + interval) < end_time
    hours << stepped_start_time.hour
  end
  hours << end_time.hour

  hours
end
