import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { Rcon } from 'rcon-client';

const app = express();
const port = 3000;

// Cho phép Web kết nối với Server Backend
app.use(cors());
app.use(express.json());

// ==========================================
// 1. CẤU HÌNH DATABASE (CƠ SỞ DỮ LIỆU)
// ==========================================
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // Nhập mật khẩu MySQL của bạn vào đây
    database: 'minecraft_webstore',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ==========================================
// 2. CẤU HÌNH RCON (KẾT NỐI SERVER MINECRAFT)
// ==========================================
const rconOptions = {
    host: '127.0.0.1', // IP của VPS hoặc máy chủ chạy game
    port: 25575,       // Cổng RCON (xem trong server.properties)
    password: 'mat_khau_rcon_cua_ban' 
};

// ==========================================
// 3. CÁC API XỬ LÝ CHÍNH
// ==========================================

// API: Lấy danh sách Top Đại Gia đưa lên Web
app.get('/api/leaderboard', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT username, balance FROM users ORDER BY balance DESC LIMIT 5');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi Database:', error);
        res.status(500).json({ success: false, message: 'Không thể lấy dữ liệu xếp hạng' });
    }
});

// API: Xử lý khi người chơi bấm nút "Mua Ngay"
app.post('/api/buy', async (req, res) => {
    const { username, packageId } = req.body;

    // TODO: Ở đây sẽ kiểm tra số dư và trừ tiền trong Database...

    try {
        // Kết nối thẳng vào Server Game
        const rcon = await Rcon.connect(rconOptions);
        
        // Bắn lệnh vào Console Server (Ví dụ: Trao Rank MVP+)
        await rcon.send(`lp user ${username} parent set mvp+`);
        
        // Phát loa thông báo cho toàn Server biết
        await rcon.send(`say §a[Minestore] §eĐại gia §b${username} §evừa tậu thành công gói §dMVP+§e!`);
        
        rcon.end();
        res.json({ success: true, message: 'Thanh toán thành công! Rank đã được gửi vào game.' });
    } catch (error) {
        console.error('Lỗi RCON:', error);
        res.status(500).json({ success: false, message: 'Server game đang tắt hoặc mất kết nối.' });
    }
});

// ==========================================
// 4. KHỞI ĐỘNG HỆ THỐNG
// ==========================================
app.listen(port, () => {
    console.log(`🚀 [AEMauA Backend] Đang chạy tại cổng ${port}`);
    console.log(`🔗 Hệ thống RCON và Database đã sẵn sàng!`);
});
