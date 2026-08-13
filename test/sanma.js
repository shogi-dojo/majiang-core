const assert = require('assert');
const Majiang = require('../');

suite('Sanma (3-player) Support', () => {

    test('Shan constructs wall without m2-m8 in 3-player mode', () => {
        const shan = new Majiang.Shan({ '三人打ち': true });
        // Standard yonma wall has 136 tiles; sanma omits 28 manzu tiles (m2-m8 * 4 = 28), total 108 tiles
        assert.equal(shan._pai.length, 108);
        assert.ok(!shan._pai.some(p => p.match(/^m[2-8]/)));
    });

    test('Shoupai disallows chii in 3-player mode', () => {
        const shoupai = Majiang.Shoupai.fromString('m123p123s123z1112');
        const chi = shoupai.get_chi_mianzi('p4-', true, true);
        assert.deepEqual(chi, []);
    });

    test('Score calculation (get_defen) in 3-player tsumo - non-dealer', () => {
        // Hand: 1 han 30 fu -> base = 240. Dealer pays 480->500, non-dealer pays 240->300. Total = 800
        const shoupai = Majiang.Shoupai.fromString('p123p456s123s456z11');
        const param = Majiang.Util.hule_param({
            rule: { '三人打ち': true },
            menfeng: 1, // Non-dealer
            zhuangfeng: 0,
            hupai: { tianhu: 0 },
        });

        const res = Majiang.Util.hule(shoupai, null, param);
        assert.ok(res);
        assert.equal(res.defen, 800); // 500 from dealer + 300 from non-dealer
        assert.deepEqual(res.fenpei, [-500, 800, -300]);
    });

    test('Score calculation (get_defen) in 3-player tsumo - dealer', () => {
        // Dealer tsumo 1 han 30 fu: base 240 -> 2 non-dealers pay 480->500 each. Total = 1000
        const shoupai = Majiang.Shoupai.fromString('p123p456s123s456z11');
        const param = Majiang.Util.hule_param({
            rule: { '三人打ち': true },
            menfeng: 0, // Dealer
            zhuangfeng: 0,
        });

        const res = Majiang.Util.hule(shoupai, null, param);
        assert.ok(res);
        assert.equal(res.defen, 1000); // 500 from each of 2 non-dealers
        assert.deepEqual(res.fenpei, [1000, -500, -500]);
    });

    test('Kita / Nukidora adds han to post_hupai', () => {
        const shoupai = Majiang.Shoupai.fromString('p123p456s123s456z11');
        const param = Majiang.Util.hule_param({
            rule: { '三人打ち': true },
            menfeng: 1,
            zhuangfeng: 0,
            kita: 2, // 2 Kita called
        });

        const res = Majiang.Util.hule(shoupai, null, param);
        assert.ok(res);
        assert.ok(res.hupai.some(h => h.name === '北ドラ' && h.fanshu === 2));
    });
});
