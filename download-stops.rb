# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

require 'open-uri'
require 'nokogiri'
require 'json'

AGENCY_NAME = 'sf-muni'

routes_xml_conn = open("http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=#{AGENCY_NAME}")
routes_xml = Nokogiri::XML(routes_xml_conn.read)
routes_xml_conn.close

routes = [] # [{tag: String, title: String, directions: [Direction]}]

routes_xml.css('route').each do |r|
  routes << {tag: r['tag'], title: r['title'], directions: []}
end

routes.each do |route|
  puts "Loading route #{route[:tag]}..."
  route_xml_conn = open("http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=#{AGENCY_NAME}&r=#{route[:tag]}")
  route_xml = Nokogiri::XML(route_xml_conn)
  route_xml_conn.close

  directions = {} # name => {name: String, stops: [{tag: String, title String}]}

  stop_direction_hash = {}
  route_xml.css('direction').each do |d|
    name = d['name']
    if directions.has_key? name
      puts "ERROR: Duplicate direction #{name} for route #{route[:tag]}"
    end
    direction = {name: name, title: d['title'], stops: []}
    directions[name] = direction
    d.css('stop').each do |s|
      stop_direction_hash[s['tag']] = direction
    end
  end

  route_xml.css('route > stop').each do |s|
    tag = s['tag']
    direction = stop_direction_hash[tag]
    if direction.nil?
      puts "ERROR: Stop tag #{tag} has no direction for route #{route[:tag]}"
      next
    end
    directions[direction[:name]][:stops] << {tag: tag, title: s['title']}
  end

  route[:directions] = directions.values

end

json = routes.to_json
filename = ARGV[0]
if filename.nil?
  puts json
else
  file = File.open(filename, 'w')
  file.print json
  file.close
end





