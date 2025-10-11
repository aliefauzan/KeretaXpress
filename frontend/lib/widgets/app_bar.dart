import 'package:flutter/material.dart';
import 'package:keretaxpress/utils/theme.dart';
import 'package:keretaxpress/core/services/api_service.dart';
import 'package:keretaxpress/core/services/auth_service.dart';

class CustomAppBar extends StatefulWidget implements PreferredSizeWidget {
  const CustomAppBar({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(110);

  @override
  State<CustomAppBar> createState() => _CustomAppBarState();
}

class _CustomAppBarState extends State<CustomAppBar> {
  final AuthService _authService = AuthService();
  final ApiService _apiService = ApiService();
  bool _isLoggedIn = false;
  String _userName = '';
  String _userEmail = '';

  String _getCurrentRoute(BuildContext context) {
    final ModalRoute? route = ModalRoute.of(context);
    return route?.settings.name ?? '';
  }

  @override
  void initState() {
    super.initState();
    _checkLoginStatus();
  }

  Future<void> _checkLoginStatus() async {
    bool loggedIn = _apiService.isLoggedIn();
    if (!mounted) return;
    
    if (loggedIn) {
      try {
        String? userUUID = await _authService.getUserUUID();
        if (userUUID == null || userUUID.isEmpty) {
          setState(() {
            _userName = '';
            _userEmail = '';
            _isLoggedIn = true;
          });
          return;
        }
        final userInfo = await _apiService.get('/user');
        if (!mounted) return;
        setState(() {
          _isLoggedIn = true;
          _userName = userInfo['user'] != null ? userInfo['user']['name'] ?? '' : '';
          _userEmail = userInfo['user'] != null ? userInfo['user']['email'] ?? '' : '';
        });
      } catch (e) {
        if (!mounted) return;
        setState(() {
          _isLoggedIn = false;
          _userName = '';
          _userEmail = '';
        });
      }
    } else {
      if (!mounted) return;
      setState(() {
        _isLoggedIn = false;
        _userName = '';
        _userEmail = '';
      });
    }
  }

  void _logout() async {
    await _authService.signOut();
    _apiService.setToken('');
    if (!mounted) return;
    setState(() {
      _isLoggedIn = false;
      _userName = '';
      _userEmail = '';
    });
    Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
  }

  void _showAccountDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Akun'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Nama: $_userName'),
              const SizedBox(height: 8),
              Text('Email: $_userEmail'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('Tutup'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _logout();
              },
              child: const Text('Logout'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Image.asset(
            'assets/logo/logo_white.png',
            height: 40,
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'KERETAXPRESS',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'AYO NAIK KERETA',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.notifications, color: Colors.white),
          onPressed: () {},
        ),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(50),
        child: Container(
          height: 50,
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.3),
                spreadRadius: 1,
                blurRadius: 5,
              ),
            ],
          ),
          child: Builder(
            builder: (context) {
              final currentRoute = ModalRoute.of(context)?.settings.name ?? '';
              return Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _NavButton(
                    label: 'BERANDA',
                    icon: Icons.home,
                    selected: currentRoute == '/' || currentRoute == null,
                    onPressed: () => Navigator.pushNamedAndRemoveUntil(
                      context, '/', (route) => false),
                  ),
                  _NavButton(
                    label: 'JADWAL',
                    icon: Icons.schedule,
                    selected: currentRoute == '/schedule',
                    onPressed: () => Navigator.pushNamed(context, '/schedule'),
                  ),
                  _NavButton(
                    label: 'RIWAYAT',
                    icon: Icons.train,
                    selected: currentRoute == '/booking-history',
                    onPressed: () => Navigator.pushNamed(context, '/booking-history'),
                  ),
                  _NavButton(
                    label: 'AKUN',
                    icon: Icons.account_circle,
                    selected: currentRoute == '/login' || currentRoute == '/account',
                    onPressed: () {
                      if (_isLoggedIn) {
                        _showAccountDialog();
                      } else {
                        Navigator.pushNamed(context, '/login');
                      }
                    },
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _NavButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onPressed;
  final bool selected;

  const _NavButton({
    required this.label,
    required this.icon,
    required this.onPressed,
    this.selected = false,
  });

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(
        minWidth: 60,
        maxHeight: 50,
      ),
      child: InkResponse(
        onTap: onPressed,
        child: SizedBox(
          height: 50,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.max,
            children: [
              Icon(
                icon,
                color: selected ? AppTheme.primaryColor : Colors.black54,
                size: 20,
              ),
              const SizedBox(height: 2),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                decoration: selected
                    ? const BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: AppTheme.primaryColor,
                            width: 2,
                          ),
                        ),
                      )
                    : null,
                child: Text(
                  label,
                  style: TextStyle(
                    color: selected ? AppTheme.primaryColor : Colors.black,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
