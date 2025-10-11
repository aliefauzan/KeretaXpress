import 'package:flutter/material.dart';
// import 'package:keretaxpress/models/train.dart'; // Removed
import 'package:keretaxpress/utils/duration_formatter.dart'; // Import the utility
import 'package:keretaxpress/utils/theme.dart'; // For AppTheme colors if directly used

class TrainTimeline extends StatelessWidget {
  final String departureTime;
  final String arrivalTime;
  final String departureStation;
  final String arrivalStation;
  final String duration;
  final bool isFirst;
  final bool isLast;

  const TrainTimeline({
    super.key,
    required this.departureTime,
    required this.arrivalTime,
    required this.departureStation,
    required this.arrivalStation,
    required this.duration,
    this.isFirst = false,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildDot(context, isFirst, true),
              Expanded(
                child: Container(
                  width: 2,
                  color: isLast ? Colors.transparent : Theme.of(context).dividerColor, // Use theme color
                ),
              ),
              _buildDot(context, isLast, false),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildStationInfo(
                  context,
                  time: departureTime,
                  station: departureStation,
                  isDeparture: true,
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8.0), // Add some space for duration
                  child: Text(
                    formatDuration(duration), // Use the utility
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.primaryColor, // Or some other appropriate color
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                ),
                _buildStationInfo(
                  context,
                  time: arrivalTime,
                  station: arrivalStation,
                  isDeparture: false,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDot(BuildContext context, bool isEdge, bool isDeparture) {
    final Color color = AppTheme.primaryColor; // Consistent color
    if (isEdge && !isDeparture) { // Last arrival dot
      return Container(
        width: 12,
        height: 12,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: color, width: 2),
        ),
      );
    }
    return Container(
      width: 12,
      height: 12,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
      ),
    );
  }

  Widget _buildStationInfo(BuildContext context, {required String time, required String station, required bool isDeparture}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          time,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.black87
              ),
        ),
        const SizedBox(height: 2),
        Text(
          station,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.black54),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
} 