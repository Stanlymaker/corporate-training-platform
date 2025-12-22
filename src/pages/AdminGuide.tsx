import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export default function AdminGuide() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Руководство администратора</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <Icon name="X" size={20} />
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2">Руководство администратора</h1>
          <p className="text-lg opacity-90">Корпоративная образовательная платформа</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-rose-600 mb-4 pb-2 border-b-2 border-rose-600">1. Введение</h2>
            <p className="text-gray-700 mb-4">
              Данное руководство предназначено для администраторов корпоративной образовательной платформы
              и содержит инструкции по управлению системой, созданию образовательного контента,
              управлению пользователями и мониторингу обучения сотрудников.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1.1. Обязанности администратора</h3>
            <ul className="list-disc ml-6 space-y-2 text-gray-700">
              <li>Создание и управление учетными записями пользователей</li>
              <li>Создание, редактирование и публикация обучающих курсов</li>
              <li>Разработка и настройка тестов для проверки знаний</li>
              <li>Управление системой цифровых наград</li>
              <li>Мониторинг прогресса обучения сотрудников</li>
              <li>Анализ статистики и формирование отчетов</li>
              <li>Обеспечение работоспособности платформы</li>
            </ul>

            <div className="bg-red-50 border-l-4 border-red-600 p-4 mt-4">
              <p className="text-gray-700"><strong className="text-red-600">Важно:</strong> Учетные данные администратора предоставляют полный доступ к системе. Храните их в безопасности и никогда не передавайте третьим лицам.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rose-600 mb-4 pb-2 border-b-2 border-rose-600">2. Панель управления</h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.1. Главная панель (Dashboard)</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-rose-600 text-white">
                    <th className="border border-gray-300 px-4 py-3 text-left">Раздел</th>
                    <th className="border border-gray-300 px-4 py-3 text-left">Описание</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3">Статистика</td>
                    <td className="border border-gray-300 px-4 py-3">Общее количество пользователей, курсов, завершенных курсов</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">Последняя активность</td>
                    <td className="border border-gray-300 px-4 py-3">Лента событий: начало курсов, завершения, полученные награды</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3">Статистика платформы</td>
                    <td className="border border-gray-300 px-4 py-3">Средний прогресс, активные пользователи, успеваемость</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.2. Навигационное меню</h3>
            <p className="text-gray-700 mb-2">Административная панель содержит следующие разделы:</p>
            <ul className="list-disc ml-6 space-y-2 text-gray-700">
              <li><strong>Панель</strong> — главная страница со статистикой</li>
              <li><strong>Курсы</strong> — управление обучающими курсами</li>
              <li><strong>Тесты</strong> — создание и управление тестами</li>
              <li><strong>Награды</strong> — управление системой наград</li>
              <li><strong>Пользователи</strong> — управление учетными записями</li>
              <li><strong>Логи</strong> — просмотр системных событий</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rose-600 mb-4 pb-2 border-b-2 border-rose-600">3. Управление пользователями</h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.1. Создание пользователя</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-pink-500">
                <p className="text-gray-700"><span className="font-semibold">Шаг 1:</span> В меню выберите раздел <strong>«Пользователи»</strong>.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-pink-500">
                <p className="text-gray-700"><span className="font-semibold">Шаг 2:</span> Нажмите кнопку <strong>«Добавить пользователя»</strong>.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-pink-500">
                <p className="text-gray-700 mb-2"><span className="font-semibold">Шаг 3:</span> Заполните обязательные поля:</p>
                <ul className="list-disc ml-6 space-y-1 text-gray-700">
                  <li><strong>Имя</strong> — полное имя сотрудника</li>
                  <li><strong>Email</strong> — корпоративный email (логин для входа)</li>
                  <li><strong>Пароль</strong> — временный пароль для первого входа</li>
                  <li><strong>Роль</strong> — выберите «Студент» или «Администратор»</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-pink-500">
                <p className="text-gray-700"><span className="font-semibold">Шаг 4:</span> Нажмите <strong>«Создать пользователя»</strong>.</p>
              </div>
            </div>

            <div className="bg-amber-50 border-l-4 border-rose-600 p-4 mt-4">
              <p className="text-gray-700"><strong className="text-rose-600">Рекомендация:</strong> Используйте корпоративные email-адреса и требуйте от пользователей смену временного пароля при первом входе.</p>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.3. Удаление пользователя</h3>
            <div className="bg-red-50 border-l-4 border-red-600 p-4">
              <p className="text-gray-700"><strong className="text-red-600">Внимание:</strong> Удаление пользователя приведет к потере всех данных о его прогрессе и результатах. Эта операция необратима!</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rose-600 mb-4 pb-2 border-b-2 border-rose-600">4. Управление курсами</h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.1. Создание нового курса</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-pink-500">
                <p className="text-gray-700"><span className="font-semibold">Шаг 1:</span> Перейдите в раздел <strong>«Курсы»</strong>.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-pink-500">
                <p className="text-gray-700"><span className="font-semibold">Шаг 2:</span> Нажмите кнопку <strong>«Создать курс»</strong>.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-pink-500">
                <p className="text-gray-700 mb-2"><span className="font-semibold">Шаг 3:</span> Заполните информацию о курсе:</p>
                <ul className="list-disc ml-6 space-y-1 text-gray-700">
                  <li><strong>Название</strong> — краткое название курса</li>
                  <li><strong>Описание</strong> — подробное описание содержания</li>
                  <li><strong>Категория</strong> — тематическая категория</li>
                  <li><strong>Длительность</strong> — примерное время прохождения</li>
                  <li><strong>Сложность</strong> — уровень сложности</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.3. Публикация курса</h3>
            <div className="bg-amber-50 border-l-4 border-rose-600 p-4">
              <p className="text-gray-700"><strong className="text-rose-600">Важно:</strong> Курс должен содержать минимум один урок перед публикацией.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rose-600 mb-4 pb-2 border-b-2 border-rose-600">5. Управление тестами</h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.1. Создание теста</h3>
            <p className="text-gray-700 mb-2">Основные параметры теста:</p>
            <ul className="list-disc ml-6 space-y-2 text-gray-700">
              <li><strong>Проходной балл</strong> — минимальный процент для успешной сдачи (рекомендуется 70%)</li>
              <li><strong>Время на прохождение</strong> — лимит времени (опционально)</li>
              <li><strong>Количество попыток</strong> — сколько раз можно пересдавать</li>
              <li><strong>Перемешивание вопросов</strong> — случайный порядок вопросов</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.2. Типы вопросов</h3>
            <ul className="list-disc ml-6 space-y-2 text-gray-700">
              <li><strong>Один вариант</strong> — один правильный ответ</li>
              <li><strong>Множественный выбор</strong> — несколько правильных ответов</li>
              <li><strong>Свободный ответ</strong> — текстовое поле</li>
            </ul>

            <div className="bg-amber-50 border-l-4 border-rose-600 p-4 mt-4">
              <p className="text-gray-700 mb-2"><strong className="text-rose-600">Рекомендуемая структура теста:</strong></p>
              <ul className="list-disc ml-6 space-y-1 text-gray-700">
                <li>10-20 вопросов на курс</li>
                <li>80% вопросов с одним вариантом, 20% с множественным выбором</li>
                <li>Проходной балл 70-80%</li>
                <li>Время на прохождение: 30-45 минут</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rose-600 mb-4 pb-2 border-b-2 border-rose-600">6. Управление наградами</h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.1. Создание награды</h3>
            <p className="text-gray-700 mb-2">При создании награды укажите:</p>
            <ul className="list-disc ml-6 space-y-2 text-gray-700">
              <li><strong>Название</strong> — название награды</li>
              <li><strong>Описание</strong> — за что выдается</li>
              <li><strong>Иконка</strong> — визуальное представление</li>
              <li><strong>Тип</strong> — за курс, за группу курсов, за достижение</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.3. Автоматическая выдача наград</h3>
            <p className="text-gray-700">
              Система автоматически отслеживает прогресс пользователей и выдает награды при выполнении условий.
              Уведомления о полученных наградах отображаются в интерфейсе пользователя.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rose-600 mb-4 pb-2 border-b-2 border-rose-600">7. Мониторинг и аналитика</h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7.1. Просмотр статистики пользователей</h3>
            <p className="text-gray-700 mb-2">В профиле пользователя доступна подробная статистика:</p>
            <ul className="list-disc ml-6 space-y-2 text-gray-700">
              <li>Активные курсы</li>
              <li>Завершенные курсы с датами</li>
              <li>Результаты тестов</li>
              <li>Полученные награды</li>
              <li>Общий процент прогресса</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7.3. Системные логи</h3>
            <p className="text-gray-700 mb-2">В разделе <strong>«Логи»</strong> доступна история всех действий на платформе:</p>
            <ul className="list-disc ml-6 space-y-2 text-gray-700">
              <li>Вход пользователей в систему</li>
              <li>Начало и завершение курсов</li>
              <li>Прохождение тестов</li>
              <li>Получение наград</li>
              <li>Административные действия</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rose-600 mb-4 pb-2 border-b-2 border-rose-600">8. Безопасность</h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">8.1. Рекомендации по безопасности</h3>
            <ul className="list-disc ml-6 space-y-2 text-gray-700">
              <li>Используйте сложные пароли для учетной записи администратора</li>
              <li>Регулярно меняйте пароль (не реже раза в 3 месяца)</li>
              <li>Не передавайте учетные данные третьим лицам</li>
              <li>Завершайте сеанс работы при выходе из системы</li>
              <li>Регулярно проверяйте логи на подозрительную активность</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">8.2. Управление правами доступа</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-rose-600 text-white">
                    <th className="border border-gray-300 px-4 py-3 text-left">Роль</th>
                    <th className="border border-gray-300 px-4 py-3 text-left">Права доступа</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3">Администратор</td>
                    <td className="border border-gray-300 px-4 py-3">Полный доступ ко всем функциям платформы</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">Студент</td>
                    <td className="border border-gray-300 px-4 py-3">Просмотр и прохождение курсов, тестов, наград</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="text-center mt-8 text-gray-500 text-sm">
          © 2024 Корпоративная образовательная платформа. Руководство администратора v1.0
        </div>
      </div>
    </div>
  );
}