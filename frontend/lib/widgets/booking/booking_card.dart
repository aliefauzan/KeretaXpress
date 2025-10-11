import 'package:flutter/material.dart';
import 'package:keretaxpress/models/booking.dart';
import 'package:keretaxpress/models/train.dart'; // Keep this, might be needed if TrainCard is used or train details are directly shown
import 'package:keretaxpress/utils/theme.dart';
import 'package:keretaxpress/utils/currency_formatter.dart';

class BookingCard extends StatelessWidget {
  final Booking booking;
  final Train train; // Assuming Train object is passed for details
  final VoidCallback? onUploadProof;
  final bool showUploadButton;

  const BookingCard({
    Key? key,
    required this.booking,
    required this.train,
    this.onUploadProof,
    this.showUploadButton = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.0)),
      margin: const EdgeInsets.symmetric(vertical: 8.0),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    train.name,
                    style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: booking.status == 'confirmed'
                        ? AppTheme.successColor.withOpacity(0.1)
                        : booking.status == 'pending'
                            ? AppTheme.warningColor.withOpacity(0.1)
                            : Colors.grey.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8.0),
                    border: Border.all(
                       color: booking.status == 'confirmed'
                        ? AppTheme.successColor
                        : booking.status == 'pending'
                            ? AppTheme.warningColor
                            : Colors.grey,
                        width: 0.5
                    )
                  ),
                  child: Text(
                    booking.status == 'confirmed' ? 'Confirmed' :
                    booking.status == 'pending' ? 'Pending' :
                    booking.status.toUpperCase(),
                    style: textTheme.bodySmall?.copyWith(
                      color: booking.status == 'confirmed'
                          ? AppTheme.successColor
                          : booking.status == 'pending'
                              ? AppTheme.warningColor
                              : Colors.grey[700],
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              booking.passengerName,
              style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 4),
            Text(
              "Travel Date: ${train.date}  •  Class: ${train.classType}",
              style: textTheme.bodySmall?.copyWith(color: Colors.grey[700]),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        train.time,
                        style: textTheme.titleMedium?.copyWith(color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        train.departureStationName ?? train.departure,
                        style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0),
                  child: Icon(Icons.arrow_forward_rounded, color: AppTheme.primaryColor, size: 20),
                ),
                Expanded(
                  flex: 2,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        train.arrivalTime,
                        style: textTheme.titleMedium?.copyWith(color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        train.arrivalStationName ?? train.arrival,
                        style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
                        textAlign: TextAlign.end,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Total Price',
                        style: textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
                      ),
                      Text(
                        currencyFormat.format(parsePrice(booking.price)),
                        style: textTheme.titleMedium?.copyWith(color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
                if (showUploadButton && booking.status != 'confirmed' && onUploadProof != null)
                  Flexible(
                    fit: FlexFit.loose,
                    child: Padding(
                      padding: const EdgeInsets.only(left: 8.0),
                      child: ElevatedButton(
                        onPressed: onUploadProof,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          textStyle: textTheme.labelLarge?.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text('Upload Bukti'),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
} 