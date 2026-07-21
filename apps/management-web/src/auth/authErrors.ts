export function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Bạn cần xác nhận email trước khi đăng nhập.";
  }
  if (normalized.includes("user already registered")) {
    return "Email này đã được đăng ký. Hãy chuyển sang trang đăng nhập.";
  }
  if (normalized.includes("password should be")) {
    return "Mật khẩu cần có ít nhất 8 ký tự.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Bạn đã thử quá nhiều lần. Vui lòng chờ một chút rồi thử lại.";
  }
  return "Không thể hoàn tất yêu cầu lúc này. Vui lòng thử lại.";
}
