# Инструмент работы с кошельками

## Установка
`npm install` 

Все пользовательские настройки и файлы в папке `user_data`. В `user_data/config.js` включаем/выключаем нужны модули, указываем адреса и прочие настройки.

Прокси в файле `user_data/proxies.txt` в формате `http://login:pass@domain:port`

Для запуска `npm start`

## Что умеет

### Веб сервер

Запускает локальный сайт, с помощью которого можно смотреть всю описанную ниже статистику в браузере. Есть сортировка колонок, подсвечивание низких балансов и т.д.  
!!! Добавлена авторизация по логину-паролю, необходимо создать файл .env в корне проекта и записать:
AUTH_LOGIN=<логин>
AUTH_PASSWORD=<пароль>

### Проверка активности

### Чекер сетей:
* ZkSync
* Layerzero
* Wormhole
* Zkbridge
* Hyperlane
* Zora
* Base
* Aptos
* Linea
* Scroll

Покажет в консоли и сохранит в csv файл следующую инфу:
* Баланс в эфире/стейблах
* Количество транзакций
* Уникальные дни/недели/месяцы
* Первая и последняя транзакции
* Количество потраченного газа
* Специфичную для чейна инфу

### Получение балансов

Покажет баланс нативного токена/usdt/usdc/dai в выбранной сети. Доступны: eth, arbitrum, optimism, polygon, bsc, avalanche.

### EVM Checker

* Количество транзакций
* Уникальные дни/недели/месяцы
* Первая и последняя транзакции
* Количество потраченного газа

Этот скрипт рекомендую именно клонировать, а не качать zip - так как это будет универсальный скрипт для работы с кошельками, и со временем туда переедет функционал проверки балансов по EVM сетям.

Для работы с EVM Checker нужно переименовать .env.example в .env и добавить Moralis API Key
