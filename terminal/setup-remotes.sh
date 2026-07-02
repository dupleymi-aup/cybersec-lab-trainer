#!/bin/bash
# Настройка push в оба репозитория одновременно
# Запустить после клонирования: bash setup-remotes.sh

git remote set-url origin git@github.com:dupleymi-aup/cybersec-lab-trainer.git
git remote set-url --add --push origin git@github.com:dupleymi-aup/cybersec-lab-trainer.git
git remote set-url --add --push origin git@gitverse.ru:dupleymi-amp/cybersec-lab-trainer.git

echo "Remote настроены. Проверка:"
git remote -v
