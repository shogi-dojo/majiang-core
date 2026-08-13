const assert = require('assert');
const Majiang = require('../');

suite('Sanma (3-player) Support', () => {

    test('Shan constructs wall without m2-m8 in 3-player mode', () => {
        const shan = new Majiang.Shan(Majiang.rule({ '三人打ち': true }));
        // Standard yonma wall has 136 tiles; sanma omits 28 manzu tiles (m2-m8 * 4 = 28), total 108 tiles
        assert.equal(shan._pai.length, 108);
        assert.ok(!shan._pai.some(p => p.match(/^m[2-8]/)));
    });

    test('Shoupai disallows chii in 3-player mode', () => {
        const shoupai = Majiang.Shoupai.fromString('m123p123s123z1112');
        const chi = shoupai.get_chi_mianzi('p4-', true, true);
        assert.deepEqual(chi, []);
    });

    test('Game.get_chi_mianzi disallows chii from the sanma rule alone', () => {
        // The game layer must derive `sanma` from the rule; callers do not pass it.
        const shoupai = Majiang.Shoupai.fromString('m123p123s123z1112');
        const rule    = Majiang.rule({ '三人打ち': true });
        assert.deepEqual(
            Majiang.Game.get_chi_mianzi(rule, shoupai, 'p4-', 10), []);
        // Yonma is unaffected.
        const yonma = Majiang.rule();
        assert.ok(
            Majiang.Game.get_chi_mianzi(yonma, shoupai, 'p4-', 10).length > 0);
    });

    test('dora indicator m1 wraps to m9 in 3-player mode', () => {
        // m2-m8 do not exist in sanma, so an m1 indicator must point at m9.
        assert.equal(Majiang.Shan.zhenbaopai('m1', true), 'm9');
        assert.equal(Majiang.Shan.zhenbaopai('m9', true), 'm1');
        assert.equal(Majiang.Shan.zhenbaopai('m1'), 'm2');

        const rule  = Majiang.rule({ '三人打ち': true });
        const param = Majiang.Util.hule_param({
            rule, menfeng: 1, zhuangfeng: 0, baopai: ['m1'],
        });
        // Hand holds m9 (the real sanma dora) and no m2.
        const res = Majiang.Util.hule(
            Majiang.Shoupai.fromString('m999p123p456s123z11'), null, param);
        assert.ok(res.hupai.some(h => h.name == 'ドラ' && h.fanshu == 3));
    });

    test('honba is paid in whole 100-point units on a 3-player tsumo', () => {
        const rule = Majiang.rule({ '三人打ち': true });
        for (let changbang of [0, 1, 2]) {
            for (let menfeng of [0, 1]) {
                const param = Majiang.Util.hule_param({
                    rule, menfeng, zhuangfeng: 0, changbang,
                });
                const res = Majiang.Util.hule(
                    Majiang.Shoupai.fromString('p123p456s123s456z11'),
                    null, param);
                assert.equal(res.fenpei.reduce((a, b) => a + b, 0), 0,
                    `changbang=${changbang} menfeng=${menfeng} must be zero-sum`);
                for (let f of res.fenpei) {
                    assert.equal(f % 100, 0,
                        `changbang=${changbang} menfeng=${menfeng} payment ${f}`
                        + ` must be a multiple of 100`);
                }
            }
        }
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
