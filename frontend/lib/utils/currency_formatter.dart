import 'package:intl/intl.dart';

final NumberFormat currencyFormat = NumberFormat.currency(
  locale: 'id_ID',
  symbol: 'Rp ',
  decimalDigits: 0,
);

double parsePrice(String price) {
  try {
    // Remove currency symbol and any whitespace
    final cleanPrice = price.replaceAll(RegExp(r'[Rp\s.]'), '');
    // Convert to double
    return double.parse(cleanPrice);
  } catch (e) {
    return 0.0;
  }
}
