const numberToWords = (value) => {
    const convertResult = new Object();
    let countPart, sendValue, sendResult, nameFraction_kaz, nameFraction_rus;

    if (value === null || String(value).length === 0) {
        return 'Не указано значение.';
    }

    if (!Number(value) && Number(value) != 0) {
        return 'Введенное значение: "' + value + '"" - не является числовым.';
    }

    if (String(value).length - String(Math.trunc(value)).length == 0) {
        countPart = 1;
        curValuePart1 = value;
        curValuePart2 = '00';
    } else {
        countPart = 2;
        curValuePart1 = Math.trunc(value);
        curValuePart2 = Number(value - Math.trunc(value)).toFixed(String(value).length - String(curValuePart1).length - 1);

        // Если после точки много цифр, огругляем до сотых
        if (String(curValuePart2).length > 4) {
            value = Number(value).toFixed(2);
            curValuePart1 = Math.trunc(value);
            curValuePart2 = value.substr(String(curValuePart1).length + 1, 2);
            nameFraction_kaz = 'жүзден';
            nameFraction_rus = 'сотых';
        } else {
            curValuePart1 = Math.trunc(value);
            curValuePart2 = value.substr(String(curValuePart1).length + 1, 2);
            if (String(curValuePart2).length === 2) {
                nameFraction_kaz = 'жүзден';
                nameFraction_rus = 'сотых';
            } else {
                nameFraction_kaz = 'оннан';
                nameFraction_rus = 'десятых';
            }
        }
    }

    // Для красоты: разделяет цифры по три - 5 659.00
    function numberFormat(num) {
        if (typeof num !== 'string') {
            return numberFormat(num.toString());
        } else {
            if (num.length < 4) {
                return num;
            } else {
                return numberFormat(num.slice(0, num.length - 3)) + ' ' + num.slice(num.length - 3);
            }
        }
    }
    convertResult.valueBefore = value;
    convertResult.valueAfter = numberFormat(curValuePart1) + '.' + curValuePart2;

    // Цикл по языкам: казахский и русский
    for (let index1 = 1; index1 <= 2; index1++) {
        myRes = '';

        // Цикл по частям значения: целая и дробная
        for (let index2 = 1; index2 <= countPart; index2++) {
            sendValue = index2 == '1' ? curValuePart1 : curValuePart2;

            if (index1 == '1') {
                sendResult = numberToKazakh(sendValue, '');
            } else {
                sendResult = numberToRussian(sendValue, '');
            }

            if (index2 == 1) {
                myRes = sendResult;
            } else {
                myRes =
                    myRes +
                    (countPart == 2
                        ? ' ' + (index1 == '1' ? 'бүтін' : 'целых') + ' ' + (index1 == '1' ? nameFraction_kaz + ' ' + sendResult : sendResult + ' ' + nameFraction_rus)
                        : '');
            }
        }

        // Для красоты: напишет первую букву в верхнем регистре - Пять тысяча шестьсот пятьдесят девять
        myRes = withoutGap(myRes);
        myRes = myRes.toLowerCase();

        // Для красоты: исправляет окончание на русском языке - два тысяч на две тысячи
        if (index1 === 2) {
            let text1 = '',
                text2 = '';
            for (let i = 1; i <= 12; i++) {
                if (i === 1) {
                    text1 = 'один тысяч';
                    text2 = 'одна тысяча';
                }
                if (i === 2) {
                    text1 = 'два тысяч';
                    text2 = 'две тысячи';
                }
                if (i === 3) {
                    text1 = 'три тысяч';
                    text2 = 'три тысячи';
                }
                if (i === 4) {
                    text1 = 'четыре тысяч';
                    text2 = 'четыре тысячи';
                }
                if (i === 5) {
                    text1 = 'один миллионов';
                    text2 = 'один миллион';
                }
                if (i === 6) {
                    text1 = 'два миллионов';
                    text2 = 'два миллиона';
                }
                if (i === 7) {
                    text1 = 'три миллионов';
                    text2 = 'три миллиона';
                }
                if (i === 8) {
                    text1 = 'четыре миллионов';
                    text2 = 'четыре миллиона';
                }
                if (i === 9) {
                    text1 = 'один миллиардов';
                    text2 = 'один миллиард';
                }
                if (i === 10) {
                    text1 = 'два миллиардов';
                    text2 = 'два миллиарда';
                }
                if (i === 11) {
                    text1 = 'три миллиардов';
                    text2 = 'три миллиарда';
                }
                if (i === 12) {
                    text1 = 'четыре миллиардов';
                    text2 = 'четыре миллиарда';
                }
                myRes = myRes.replace(text1, text2);
            }
        }

        function capitalize(s) {
            return s && s[0].toUpperCase() + s.slice(1);
        }
        myRes = capitalize(myRes);

        // console.log(myRes);
        if (index1 == '1') {
            convertResult.valueKaz = myRes;
        } else {
            convertResult.valueRus = myRes;
        }
    }

    // Для красоты: удаляет лишних пробелов
    function withoutGap(mainText) {
        let myRes = '',
            curLetter,
            prevLetter;
        for (let i = 0; i < mainText.length; i++) {
            curLetter = mainText.substr(i, 1);
            // console.log(curLetter);
            if (prevLetter != curLetter) {
                myRes = myRes + '' + curLetter;
            } else {
                if (prevLetter != ' ') {
                    myRes = myRes + '' + curLetter;
                }
            }
            prevLetter = curLetter;
        }
        return myRes;
    }

    // Перевод цифр на текст - казахский язык
    function numberToKazakh(n, custom_join_character) {
        // alert('Есть контакт Kaz!');
        var string = n.toString(),
            units,
            tens,
            scales,
            start,
            end,
            chunks,
            chunksLen,
            chunk,
            ints,
            i,
            word,
            words;
        var and = custom_join_character || '';

        /* Is number zero? Число ноль? */
        if (parseInt(string) === 0) {
            return 'нөл';
        }

        /* Array of units as words. Массив единиц в виде слов. */
        units = [
            '',
            'бір',
            'екі',
            'үш',
            'төрт',
            'бес',
            'алты',
            'жеті',
            'сегіз',
            'тоғыз',
            'он',
            'он бір',
            'он екі',
            'он үш',
            'он төрт',
            'он бес',
            'он алты',
            'он жеті',
            'он сегіз',
            'он тоғыз'
        ];

        /* Array of tens as words. Массив десятков в виде слов. */
        tens = ['', '', 'жиырма', 'отыз', 'қырық', 'елу', 'алпыс', 'жетпіс', 'сексен', 'тоқсан'];

        /* Array of scales as words. Массив шкал в виде слов. */
        scales = [
            '',
            'мың',
            'миллион',
            'миллиард',
            'триллион',
            'квадриллион',
            'квинтиллион',
            'секстиллион',
            'септиллион',
            'октиллион',
            'нониллион',
            'дециллион',
            'ундециллион',
            'дуодециллион',
            'тредециллион',
            'кватттуор-дециллион',
            'квиндециллион',
            'секдециллион',
            'семидециллион',
            'октодециллион',
            'новемдециллион',
            'вигинтиллион',
            'сантиллион'
        ];

        /*  Split user arguemnt into 3 digit chunks from right to left.
                Разделение аргументов пользователя на 3-значные блоки справа налево. */
        start = string.length;
        chunks = [];
        while (start > 0) {
            end = start;
            chunks.push(string.slice((start = Math.max(0, start - 3)), end));
        }

        /*  Check if function has enough scale words to be able to stringify the user argument.
                Проверяем, достаточно ли у функции шкал, чтобы можно было преобразовать аргумент пользователя в строку. */
        chunksLen = chunks.length;
        if (chunksLen > scales.length) {
            return '';
        }

        /*  Stringify each integer in each chunk.
                Строчка для каждого целого числа в каждом фрагменте. */
        words = [];
        for (i = 0; i < chunksLen; i++) {
            chunk = parseInt(chunks[i]);

            if (chunk) {
                /*  Split chunk into array of individual integers.
                        Разделить кусок на массив отдельных целых чисел. */
                ints = chunks[i].split('').reverse().map(parseFloat);

                /*  If tens integer is 1, i.e. 10, then add 10 to units integer.
                        Если целое число десятков равно 1, то есть 10, то прибавляем 10 к целому числу единиц. */
                if (ints[1] === 1) {
                    ints[0] += 10;
                }

                /*  Add scale word if chunk is not zero and array item exists.
                        Добавить шкалу, если блок не равен нулю и существует элемент массива. */
                if ((word = scales[i])) {
                    words.push(word);
                }

                /*  Add unit word if array item exists.
                        Добавить единичное слово, если элемент массива существует. */
                if ((word = units[ints[0]])) {
                    words.push(word);
                }

                /*  Add tens word if array item exists.
                        Добавляем слово десятки, если элемент массива существует. */
                if ((word = tens[ints[1]])) {
                    words.push(word);
                }

                /*  Add 'and' string after units or tens integer if:
                        Добавить строку 'и' после целых единиц или десятков, если: */
                if (ints[0] || ints[1]) {
                    /*  Chunk has a hundreds integer or chunk is the first of multiple chunks.
                            Блок состоит из сотен целых чисел или блок является первым из множества блоков. */
                    if (ints[2] || (!i && chunksLen)) {
                        words.push(and);
                    }
                }

                /*  Add hundreds word if array item exists.
                        Добавляем сотни слов, если элемент массива существует. */
                if ((word = units[ints[2]])) {
                    words.push(word + ' жүз');
                }
            }
        }
        return words.reverse().join(' ');
    }

    // Перевод цифр на текст - русский язык
    function numberToRussian(n, custom_join_character) {
        // alert('Есть контакт Rus!');
        var string = n.toString(),
            units,
            tens,
            scales,
            start,
            end,
            chunks,
            chunksLen,
            chunk,
            ints,
            i,
            word,
            words;
        var and = custom_join_character || '';

        /* Is number zero? Число ноль? */
        if (parseInt(string) === 0) {
            return 'ноль';
        }

        /* Array of units as words. Массив единиц в виде слов. */
        units = [
            '',
            'один',
            'два',
            'три',
            'четыре',
            'пять',
            'шесть',
            'семь',
            'восемь',
            'девять',
            'десять',
            'одиннадцать',
            'двенадцать',
            'тринадцать',
            'четырнадцать',
            'пятнадцать',
            'шестнадцать',
            'семнадцать',
            'восемнадцать',
            'девятнадцать'
        ];

        /* Array of tens as words. Массив десятков в виде слов. */
        tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];

        /* Array of scales as words. Массив шкал в виде слов. */
        scales = [
            '',
            'тысяч',
            'миллионов',
            'миллиардов',
            'триллион',
            'квадриллион',
            'квинтиллион',
            'секстиллион',
            'септиллион',
            'октиллион',
            'нониллион',
            'дециллион',
            'ундециллион',
            'дуодециллион',
            'тредециллион',
            'кватттуор-дециллион',
            'квиндециллион',
            'секдециллион',
            'семидециллион',
            'октодециллион',
            'новемдециллион',
            'вигинтиллион',
            'сантиллион'
        ];

        /*  Split user arguemnt into 3 digit chunks from right to left.
                Разделение аргументов пользователя на 3-значные блоки справа налево. */
        start = string.length;
        chunks = [];
        while (start > 0) {
            end = start;
            chunks.push(string.slice((start = Math.max(0, start - 3)), end));
        }

        /*  Check if function has enough scale words to be able to stringify the user argument.
                Проверяем, достаточно ли у функции шкал, чтобы можно было преобразовать аргумент пользователя в строку. */
        chunksLen = chunks.length;
        if (chunksLen > scales.length) {
            return '';
        }

        /*  Stringify each integer in each chunk.
                Строчка для каждого целого числа в каждом фрагменте. */
        words = [];
        for (i = 0; i < chunksLen; i++) {
            chunk = parseInt(chunks[i]);

            if (chunk) {
                /*  Split chunk into array of individual integers.
                        Разделить кусок на массив отдельных целых чисел. */
                ints = chunks[i].split('').reverse().map(parseFloat);

                /*  If tens integer is 1, i.e. 10, then add 10 to units integer.
                        Если целое число десятков равно 1, то есть 10, то прибавляем 10 к целому числу единиц. */
                if (ints[1] === 1) {
                    ints[0] += 10;
                }

                /*  Add scale word if chunk is not zero and array item exists.
                        Добавить шкалу, если блок не равен нулю и существует элемент массива. */
                if ((word = scales[i])) {
                    words.push(word);
                }

                /*  Add unit word if array item exists.
                        Добавить единичное слово, если элемент массива существует. */
                if ((word = units[ints[0]])) {
                    words.push(word);
                }

                /*  Add tens word if array item exists.
                        Добавляем слово десятки, если элемент массива существует. */
                if ((word = tens[ints[1]])) {
                    words.push(word);
                }

                /*  Add 'and' string after units or tens integer if:
                        Добавить строку 'и' после целых единиц или десятков, если: */
                if (ints[0] || ints[1]) {
                    /*  Chunk has a hundreds integer or chunk is the first of multiple chunks.
                            Блок состоит из сотен целых чисел или блок является первым из множества блоков. */
                    if (ints[2] || (!i && chunksLen)) {
                        words.push(and);
                    }
                }

                /*  Add hundreds word if array item exists.
                        Добавляем сотни слов, если элемент массива существует. */
                if ((word = units[ints[2]])) {
                    if (word === 'один') {
                        words.push('сто');
                    }
                    if (word === 'два') {
                        words.push('двести');
                    }
                    if (word === 'три') {
                        words.push('триста');
                    }
                    if (word === 'четыре') {
                        words.push('четыреста');
                    }
                    if (word === 'пять') {
                        words.push('пятьсот');
                    }
                    if (word === 'шесть') {
                        words.push('шестьсот');
                    }
                    if (word === 'семь') {
                        words.push('семьсот');
                    }
                    if (word === 'восемь') {
                        words.push('восемьсот');
                    }
                    if (word === 'девять') {
                        words.push('девятьсот');
                    }
                }
            }
        }
        return words.reverse().join(' ');
    }

    return convertResult;
};

numberToWords('123213123')