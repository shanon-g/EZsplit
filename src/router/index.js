import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import HangoutView from '../views/HangoutView.vue'
import CategoryView from '../views/CategoryView.vue'
import ResultsView from '../views/ResultsView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/hangout/:id',
    name: 'hangout',
    component: HangoutView
  },
  {
    path: '/hangout/:hangoutId/category/:categoryId',
    name: 'category',
    component: CategoryView
  },
  {
    path: '/hangout/:id/results',
    name: 'results',
    component: ResultsView
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router