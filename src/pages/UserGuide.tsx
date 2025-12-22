import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export default function UserGuide() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Руководство пользователя</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <Icon name="X" size={20} />
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2">Руководство пользователя</h1>
          <p className="text-lg opacity-90">Корпоративная образовательная платформа</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-600">1. Введение</h2>
            <p className="text-gray-700 mb-4">
              Корпоративная образовательная платформа — это веб-приложение для внутреннего обучения сотрудников организации.
              Платформа предоставляет доступ к обучающим курсам, тестам и системе цифровых наград за успешное прохождение обучения.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1.1. Назначение системы</h3>
            <p className="text-gray-700 mb-2">Платформа предназначена для:</p>
            <ul className="list-disc ml-6 space-y-2 text-gray-700">
              <li>Прохождения обучающих курсов различных форматов</li>
              <li>Прохождения тестирований для проверки знаний</li>
              <li>Получения цифровых наград за успешное завершение курсов</li>
              <li>Отслеживания собственного прогресса в обучении</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1.2. Требования к системе</h3>
            <ul className="list-disc ml-6 space-y-2 text-gray-700">
              <li>Современный веб-браузер (Chrome, Firefox, Safari, Edge)</li>
              <li>Подключение к интернету</li>
              <li>Разрешение экрана не менее 1280×720 пикселей</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-600">2. Начало работы</h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.1. Вход в систему</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500">
                <p className="text-gray-700"><span className="font-semibold">Шаг 1:</span> Откройте веб-браузер и перейдите по адресу платформы, предоставленному администратором.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500">
                <p className="text-gray-700"><span className="font-semibold">Шаг 2:</span> На странице входа введите ваш <strong>email</strong> и <strong>пароль</strong>, полученные от администратора.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500">
                <p className="text-gray-700"><span className="font-semibold">Шаг 3:</span> Нажмите кнопку <strong>«Войти»</strong>.</p>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-purple-600 p-4 mt-4">
              <p className="text-gray-700"><strong className="text-purple-600">Примечание:</strong> При первом входе рекомендуется сменить пароль на уникальный и надежный.</p>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.2. Главная страница</h3>
            <p className="text-gray-700 mb-2">После успешного входа вы попадете на главную страницу, где отображаются:</p>
            <ul className="list-disc ml-6 space-y-2 text-gray-700">
              <li><strong>Доступные курсы</strong> — список курсов, которые вам назначены для прохождения</li>
              <li><strong>Мой прогресс</strong> — текущий прогресс по активным курсам</li>
              <li><strong>Мои награды</strong> — полученные цифровые награды</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-600">3. Работа с курсами</h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.1. Просмотр доступных курсов</h3>
            <p className="text-gray-700 mb-2">На главной странице отображаются все курсы, доступные для прохождения. Каждая карточка курса содержит:</p>
            <ul className="list-disc ml-6 space-y-2 text-gray-700">
              <li>Название курса</li>
              <li>Описание курса</li>
              <li>Прогресс выполнения (если курс начат)</li>
              <li>Статус: «Начать», «Продолжить» или «Завершено»</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.2. Прохождение уроков</h3>
            <p className="text-gray-700 mb-2">Уроки могут содержать различные типы контента:</p>
            <ul className="list-disc ml-6 space-y-2 text-gray-700">
              <li><strong>Текстовый материал</strong> — статьи, инструкции, теоретический материал</li>
              <li><strong>Видео</strong> — видеоуроки и демонстрации</li>
              <li><strong>Презентации</strong> — слайды и визуальные материалы</li>
              <li><strong>Тесты</strong> — промежуточные и итоговые проверки знаний</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-600">4. Прохождение тестов</h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.1. Типы вопросов</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-purple-600 text-white">
                    <th className="border border-gray-300 px-4 py-3 text-left">Тип вопроса</th>
                    <th className="border border-gray-300 px-4 py-3 text-left">Описание</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3">Один вариант ответа</td>
                    <td className="border border-gray-300 px-4 py-3">Выберите один правильный ответ из предложенных вариантов</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">Несколько вариантов ответа</td>
                    <td className="border border-gray-300 px-4 py-3">Выберите все правильные ответы из списка</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3">Свободный ответ</td>
                    <td className="border border-gray-300 px-4 py-3">Введите текстовый ответ в поле ввода</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-blue-50 border-l-4 border-purple-600 p-4 mt-4">
              <p className="text-gray-700"><strong className="text-purple-600">Важно:</strong> Для успешного завершения курса необходимо набрать не менее 70% правильных ответов. При неудаче вы можете повторно пройти тест через 24 часа.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-600">5. Система наград</h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.1. Получение наград</h3>
            <p className="text-gray-700 mb-2">За успешное завершение курсов вы автоматически получаете цифровые награды. Награды могут присуждаться за:</p>
            <ul className="list-disc ml-6 space-y-2 text-gray-700">
              <li>Завершение отдельного курса</li>
              <li>Завершение группы связанных курсов</li>
              <li>Достижение определенного уровня прогресса</li>
              <li>Высокие результаты в тестах</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-600">6. Часто задаваемые вопросы</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Что делать, если забыл пароль?</h3>
                <p className="text-gray-700">Обратитесь к администратору платформы для восстановления доступа.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Можно ли проходить курсы в произвольном порядке?</h3>
                <p className="text-gray-700">Это зависит от настроек конкретного курса. Некоторые курсы требуют последовательного прохождения, другие позволяют свободную навигацию между уроками.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Что делать, если не прошел тест?</h3>
                <p className="text-gray-700">Вы можете повторно пройти тест через 24 часа. Рекомендуется еще раз изучить материалы курса перед повторной попыткой.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="text-center mt-8 text-gray-500 text-sm">
          © 2024 Корпоративная образовательная платформа. Руководство пользователя v1.0
        </div>
      </div>
    </div>
  );
}