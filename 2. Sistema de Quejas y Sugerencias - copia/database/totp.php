<?php
class TOTP {
    private static function base32Decode($secret) {
        $base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = strtoupper($secret);
        $n = 0;
        $j = 0;
        $binary = '';

        for ($i = 0; $i < strlen($secret); $i++) {
            $n = $n << 5;
            $n = $n + strpos($base32chars, $secret[$i]);
            $j = $j + 5;
            if ($j >= 8) {
                $j = $j - 8;
                $binary .= chr(($n & (0xFF << $j)) >> $j);
            }
        }
        return $binary;
    }

    public static function generateSecret($length = 16) {
        $base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';
        for ($i = 0; $i < $length; $i++) {
            $secret .= $base32chars[random_int(0, 31)];
        }
        return $secret;
    }

    public static function getQRCodeUrl($name, $secret) {
        $url = 'otpauth://totp/' . urlencode($name) . '?secret=' . $secret;
        return 'https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=' . urlencode($url);
    }

    public static function verifyCode($secret, $code, $discrepancy = 1) {
        $timeSlice = floor(time() / 30);
        
        for ($i = -$discrepancy; $i <= $discrepancy; $i++) {
            $calculatedCode = self::getCode($secret, $timeSlice + $i);
            if ($calculatedCode == $code) {
                return true;
            }
        }
        return false;
    }

    private static function getCode($secret, $timeSlice) {
        $secretkey = self::base32Decode($secret);
        
        $time = pack('N*', 0) . pack('N*', $timeSlice);
        $hm = hash_hmac('SHA1', $time, $secretkey, true);
        $offset = ord(substr($hm, -1)) & 0x0F;
        $hashpart = substr($hm, $offset, 4);
        
        $value = unpack('N', $hashpart)[1];
        $value = $value & 0x7FFFFFFF;
        
        return str_pad($value % 1000000, 6, '0', STR_PAD_LEFT);
    }
} 