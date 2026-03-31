class UserModel {
  final String id;
  final String email;
  final String name;
  final String role;
  final String? organization;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.organization,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? json['_id'] ?? '',
      email: json['email'] ?? '',
      name: json['username'] ?? json['name'] ?? '',
      role: json['role'] ?? 'Member',
      organization: json['organization'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role,
      'organization': organization,
    };
  }
}
