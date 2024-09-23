import pkg from 'discord.js-self';
import { GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';
import fs from 'fs';

// Đọc cấu hình từ file config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const TOKEN = config.TOKEN;
const WEBHOOK_URL = config.WEBHOOK_URL;
const OWO_BOT_ID = config.OWO_BOT_ID;
const FARM_CHANNEL_ID = config.FARM_CHANNEL_ID; // ID kênh farm
const ADMIN_ID = config.ADMIN_ID; // ID của admin

// Khởi tạo client với intents
const { Client } = pkg;
const intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
];
const client = new Client({ intents });

let is_farming = false;
let is_paused = false; // Trạng thái tạm dừng

// Phân loại các icon thú hiếm
const rare_animals = {
    "patreon": "<:patreon:449705754522419222>",
    "special": "<:special:427935192137859073>",
    "gem": "<:gem:510023576489951232>",
    "legendary": "<:legendary:417955061801680909>",
    "cpatreon": "<:cpatreon:483053960337293321>"
};

const random_messages = ["owo", "uwu", "OwO"];

// Hàm gửi thông báo qua webhook
async function sendWebhook(message) {
    const payload = {
        content: message,
        allowed_mentions: { parse: ['everyone'] }
    };

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            console.error(`Webhook gửi không thành công: ${response.status} - ${response.statusText}`);
        } else {
            console.log('Webhook đã gửi thành công:', message);
        }
    } catch (error) {
        console.error('Lỗi khi gửi webhook:', error);
    }
}


// Hàm tự động farm
async function farmOwo(channel) {
    is_farming = true;
    while (is_farming) {
        try {
            const currentTime = new Date().toLocaleTimeString(); // Lấy thời gian hiện tại

            await channel.send("owo hunt");
            console.log(`[${currentTime}] Bot đã gửi: "owo hunt"`);
            await sendWebhook(`[${currentTime}] Bot đã gửi: "owo hunt"`); // Gửi tới webhook

            await channel.send("owo battle");
            console.log(`[${currentTime}] Bot đã gửi: "owo battle"`);
            await sendWebhook(`[${currentTime}] Bot đã gửi: "owo battle"`); // Gửi tới webhook

            const randomMessage = random_messages[Math.floor(Math.random() * random_messages.length)];
            await channel.send(randomMessage);
            console.log(`[${currentTime}] Bot đã gửi tin nhắn ngẫu nhiên: ${randomMessage}`);
            await sendWebhook(`[${currentTime}] Bot đã gửi tin nhắn ngẫu nhiên: ${randomMessage}`); // Gửi tới webhook

            await new Promise(resolve => setTimeout(resolve, 20000)); // Đợi 20 giây
        } catch (error) {
            const currentTime = new Date().toLocaleTimeString(); // Lấy thời gian hiện tại
            console.error(`[${currentTime}] Có lỗi xảy ra khi gửi tin nhắn:`, error);
            await sendWebhook(`[${currentTime}] Có lỗi xảy ra khi gửi tin nhắn: ${error.message}`); // Gửi lỗi tới webhook
            is_farming = false; // Dừng farm khi gặp lỗi
        }
    }
}



// Hàm cầu nguyện
function prayOwo(channel) {
    setInterval(() => {
        if (!is_paused) {
            channel.send('owopray'); // Lệnh cầu nguyện
            console.log('Đã gửi lệnh cầu nguyện: owopray');
        }
    }, 60000 * 6); // Thực hiện cầu nguyện mỗi 6 phút
}

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    try {
        const farmChannel = await client.channels.fetch(FARM_CHANNEL_ID); // Lấy ID kênh farm từ config
        console.log(farmChannel); // In ra thông tin kênh để kiểm tra

        // Kiểm tra xem kênh có phải là kênh văn bản
        if (farmChannel && farmChannel.type === 'text') { 
            is_farming = true; // Bật chế độ farm
            farmOwo(farmChannel); // Bắt đầu farm
            prayOwo(farmChannel); // Bắt đầu cầu nguyện
        } else {
            console.error('Kênh farm không hợp lệ hoặc không phải kênh văn bản!');
        }
    } catch (error) {
        console.error('Không thể lấy kênh farm:', error);
    }
});

// Quét tin nhắn để phát hiện captcha và thú hiếm
client.on('messageCreate', async (message) => {
    if (message.author.id === client.user.id) return;

    // Quét tin nhắn từ OwO bot để phát hiện thú hiếm
    if (message.author.id === OWO_BOT_ID) {
        for (const [rarity, icon] of Object.entries(rare_animals)) {
            if (message.content.includes(icon)) {
                await sendWebhook(`✨ **${rarity.capitalize()} animal found!** ${icon} appeared!`);
                break;
            }
        }

        // Quét captcha
        if (message.content.includes("are you a real human?")) {
            await sendWebhook("🤖 Bot đã phát hiện captcha và sẽ tạm dừng hoạt động.");
            is_farming = false; // Tạm dừng hoạt động
            console.log("Đã phát hiện captcha, tạm dừng bot.");
        }
    }
});



// Lệnh tạm dừng và tiếp tục farm
client.on('messageCreate', async (message) => {
    if (message.author.id === ADMIN_ID) {
        if (message.content === 'tamdung') {
            is_paused = true;
            message.channel.send('Bot đã tạm dừng!');
        }

        if (message.content === 'tieptuc') {
            is_paused = false;
            message.channel.send('Bot tiếp tục hoạt động!');
        }
    }
});

// Đăng nhập bot
client.login(TOKEN);
