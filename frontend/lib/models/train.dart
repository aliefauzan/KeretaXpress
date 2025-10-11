import 'package:keretaxpress/models/station.dart';

class Train {
  final String id;
  final String name;
  final String operator;
  final String date;
  final String time;
  final String departure;
  final String arrival;
  final String arrivalTime;
  final String duration;
  final String classType;
  final String price;
  final int seatsLeft;
  final String? departureStationName;
  final String? arrivalStationName;

  Train({
    required this.id,
    required this.name,
    required this.operator,
    required this.date,
    required this.time,
    required this.departure,
    required this.arrival,
    required this.arrivalTime,
    required this.duration,
    required this.classType,
    required this.price,
    required this.seatsLeft,
    this.departureStationName,
    this.arrivalStationName,
  });

  factory Train.dummy() {
    return Train(
      id: '35151859256378',
      name: 'Serayu 255',
      operator: 'PT. KAI',
      date: '16 Nov 2024',
      time: '00:15',
      departure: 'Kiaracondong',
      arrival: 'Jatinegara',
      arrivalTime: '03:55',
      duration: '3h 40m',
      classType: 'Ekonomi',
      price: 'Rp150.000',
      seatsLeft: 50,
      departureStationName: 'Kiaracondong',
      arrivalStationName: 'Jatinegara',
    );
  }

  factory Train.fromJson(Map<String, dynamic> json, {List<Station>? stations}) {
    String? getStationName(dynamic id) {
      if (stations == null) return null;
      final found = stations.firstWhere(
        (s) => s.id.toString() == id.toString(),
        orElse: () => Station(id: 0, name: '', city: ''),
      );
      return found.name.isNotEmpty ? found.name : null;
    }

    return Train(
      id: json['id'].toString(),
      name: json['name'] ?? '',
      operator: json['operator'] ?? '',
      date: json['departure_time'] != null ? DateTime.parse(json['departure_time']).toLocal().toString().split(' ')[0] : '',
      time: json['departure_time'] != null ? DateTime.parse(json['departure_time']).toLocal().toString().split(' ')[1].substring(0,5) : '',
      departure: json['departure_station_id'] != null ? json['departure_station_id'].toString() : '',
      arrival: json['arrival_station_id'] != null ? json['arrival_station_id'].toString() : '',
      arrivalTime: json['arrival_time'] != null ? DateTime.parse(json['arrival_time']).toLocal().toString().split(' ')[1].substring(0,5) : '',
      duration: json['duration_minutes'] != null ? '${json['duration_minutes']}m' : '',
      classType: json['class_type'] ?? '',
      price: json['price'] != null ? 'Rp${json['price'].toString()}' : '',
      seatsLeft: json['available_seats'] ?? 0,
      departureStationName: getStationName(json['departure_station_id']),
      arrivalStationName: getStationName(json['arrival_station_id']),
    );
  }
}